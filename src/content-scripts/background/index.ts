import type { ContentScriptsInterface } from './types'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import type { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import type { Tabs, Browser } from 'webextension-polyfill'
import delay from 'src/util/delay'
import { openPDFInViewer } from 'src/pdf/util'

export class ContentScriptsBackground {
    remoteFunctions: ContentScriptsInterface<'provider' | 'caller'>

    constructor(
        private options: {
            injectScriptInTab: (tabId: number, file: string) => Promise<void>
            browserAPIs: Pick<
                Browser,
                'tabs' | 'storage' | 'webRequest' | 'runtime' | 'webNavigation'
            >
        },
    ) {
        this.remoteFunctions = {
            goToAnnotationFromDashboardSidebar: this
                .goToAnnotationFromDashboardSidebar,
            openPageWithSidebarInSelectedListMode: this
                .openPageWithSidebarInSelectedListMode,
            reloadTab: this.reloadTab,
            openPdfInViewer: this.openPdfInViewer,
            injectContentScriptComponent: this.injectContentScriptComponent,
            getCurrentTab: async ({ tab }) => ({
                id: tab.id,
                url: (await options.browserAPIs.tabs.get(tab.id)).url,
            }),
            openBetaFeatureSettings: async () => {
                const optionsPageUrl = this.options.browserAPIs.runtime.getURL(
                    'options.html',
                )
                window.open(optionsPageUrl + '#/features')
            },
            openAuthSettings: async () => {
                const optionsPageUrl = this.options.browserAPIs.runtime.getURL(
                    'options.html',
                )
                await this.options.browserAPIs.tabs.create({
                    active: true,
                    url: optionsPageUrl + '#/account',
                })
            },
        }

        this.options.browserAPIs.webNavigation.onHistoryStateUpdated.addListener(
            ({ tabId }) =>
                runInTab<InPageUIContentScriptRemoteInterface>(
                    tabId,
                ).handleHistoryStateUpdate(tabId),
        )
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions, { insertExtraArg: true })
    }

    injectContentScriptComponent: ContentScriptsInterface<
        'provider'
    >['injectContentScriptComponent'] = async ({ tab }, { component }) => {
        await this.options.injectScriptInTab(
            tab.id,
            `/content_script_${component}.js`,
        )
    }

    private async doSomethingInNewTab(
        fullPageUrl: string,
        openIsolatedView: (tabId: number) => Promise<true>,
        checkIfSidebarWorks: (tabId: number) => Promise<boolean>,
        retryDelay = 150,
        delayBeforeExecution = 1,
    ) {
        const { browserAPIs } = this.options
        const activeTab = await browserAPIs.tabs.create({
            active: true,
            url: fullPageUrl,
        })

        const listener = async (
            tabId: number,
            changeInfo: Tabs.OnUpdatedChangeInfoType,
        ) => {
            if (tabId === activeTab.id && changeInfo.status === 'complete') {
                await delay(delayBeforeExecution)
                try {
                    // Continues to retry `something` every `retryDelay` ms until it resolves
                    // NOTE: it does this as the content script loads are async and we currently don't
                    //      have any way of knowing when they're ready. When not ready, the RPC Promise hangs.

                    let itWorked = false
                    let i = 0
                    while (!itWorked) {
                        const done = await Promise.race([
                            delay(retryDelay),
                            checkIfSidebarWorks(tabId),
                        ])

                        if (done) {
                            await delay(250)
                            openIsolatedView(tabId)
                            itWorked = true
                        }
                    }
                    // TODO: This wait is a hack to mitigate trying to use the remote function `showSidebar` before it's ready
                    // it should be registered in the tab setup, but is not available immediately on this tab onUpdate handler
                    // since it is fired on the page complete, not on our content script setup complete.
                    // await delay(delayBeforeExecution)
                    // await something(tabId)
                } catch (err) {
                    throw err
                } finally {
                    browserAPIs.tabs.onUpdated.removeListener(listener)
                }
            }
        }

        browserAPIs.tabs.onUpdated.addListener(listener)
    }

    reloadTab: ContentScriptsInterface<'provider'>['reloadTab'] = async (
        { tab },
        { bypassCache },
    ) => {
        await this.options.browserAPIs.tabs.reload(tab.id, { bypassCache })
    }

    openPdfInViewer: ContentScriptsInterface<
        'provider'
    >['openPdfInViewer'] = async ({ tab }, { fullPdfUrl }) => {
        await openPDFInViewer(fullPdfUrl, {
            tabsAPI: this.options.browserAPIs.tabs,
            runtimeAPI: this.options.browserAPIs.runtime,
        })
    }

    openPageWithSidebarInSelectedListMode: ContentScriptsInterface<
        'provider'
    >['openPageWithSidebarInSelectedListMode'] = async (
        { tab },
        { fullPageUrl, sharedListId, checkPermissions },
    ) => {
        const allTabs = await this.options.browserAPIs.tabs.query({
            currentWindow: true,
            active: true,
        })
        await Promise.all(
            allTabs.map((tab) => {
                if (
                    tab.url.includes(sharedListId) &&
                    tab.url.includes('/p/') &&
                    !tab.url.includes('?dono')
                ) {
                    return this.options.browserAPIs.tabs.remove(tab.id)
                }
                return Promise.resolve()
            }),
        )

        await this.doSomethingInNewTab(
            fullPageUrl,
            async (tabId) => {
                await runInTab<InPageUIContentScriptRemoteInterface>(
                    tabId,
                ).showSidebar({
                    action: 'selected_list_mode_from_web_ui',
                    sharedListId,
                    manuallyPullLocalListData: checkPermissions,
                })
                return true
            },
            async (tabId) => {
                await runInTab<InPageUIContentScriptRemoteInterface>(
                    tabId,
                ).testIfSidebarSetup()
                return true
            },
        )
    }

    goToAnnotationFromDashboardSidebar: ContentScriptsInterface<
        'provider'
    >['goToAnnotationFromDashboardSidebar'] = async (
        { tab },
        { fullPageUrl, annotationCacheId },
    ) => {
        await this.doSomethingInNewTab(
            fullPageUrl,
            async (tabId) => {
                await runInTab<InPageUIContentScriptRemoteInterface>(
                    tabId,
                ).showSidebar({
                    annotationCacheId,
                    action: 'show_annotation',
                })

                await runInTab<InPageUIContentScriptRemoteInterface>(
                    tabId,
                ).goToHighlight(annotationCacheId)
                return true
            },
            async (tabId) => {
                await runInTab<InPageUIContentScriptRemoteInterface>(
                    tabId,
                ).showSidebar({
                    annotationCacheId,
                    action: 'show_annotation',
                })
                return true
            },
        )
    }
}
