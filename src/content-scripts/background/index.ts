import { ContentScriptsInterface } from './types'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { Tabs, WebNavigation, Runtime, Browser } from 'webextension-polyfill'
import { getSidebarState } from 'src/sidebar-overlay/utils'
import delay from 'src/util/delay'

export class ContentScriptsBackground {
    remoteFunctions: ContentScriptsInterface<'provider'>

    constructor(
        private options: {
            injectScriptInTab: (tabId: number, file: string) => Promise<void>
            getTab: Tabs.Static['get']
            getURL: Runtime.Static['getURL']
            webNavigation: WebNavigation.Static
            browserAPIs: Pick<Browser, 'tabs' | 'storage' | 'webRequest'>
        },
    ) {
        this.remoteFunctions = {
            goToAnnotationFromDashboardSidebar: this
                .goToAnnotationFromDashboardSidebar,
            openPageWithSidebarInSelectedListMode: this
                .openPageWithSidebarInSelectedListMode,
            injectContentScriptComponent: this.injectContentScriptComponent,
            getCurrentTab: async ({ tab }) => ({
                id: tab.id,
                url: (await options.getTab(tab.id)).url,
            }),
            openBetaFeatureSettings: async () => {
                const optionsPageUrl = this.options.getURL('options.html')
                window.open(optionsPageUrl + '#/features')
            },
            openAuthSettings: async () => {
                const optionsPageUrl = this.options.getURL('options.html')
                await this.options.browserAPIs.tabs.create({
                    active: true,
                    url: optionsPageUrl + '#/account',
                })
            },
        }

        this.options.webNavigation.onHistoryStateUpdated.addListener(
            this.handleHistoryStateUpdate,
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
        something: (tabId: number) => Promise<true>,
        retryDelay = 500,
        delayBeforeExecution = 2000,
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
                        console.log('try in tab #', ++i)
                        const done = await Promise.race([
                            delay(retryDelay),
                            something(tabId),
                        ])

                        if (done) {
                            console.log('IT WORKED!')
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

    openPageWithSidebarInSelectedListMode: ContentScriptsInterface<
        'provider'
    >['openPageWithSidebarInSelectedListMode'] = async (
        { tab },
        { fullPageUrl, sharedListId },
    ) => {
        await this.doSomethingInNewTab(fullPageUrl, async (tabId) => {
            await runInTab<InPageUIContentScriptRemoteInterface>(
                tabId,
            ).showSidebar({
                action: 'selected_list_mode_from_web_ui',
                sharedListId,
            })
            return true
        })
    }

    goToAnnotationFromDashboardSidebar: ContentScriptsInterface<
        'provider'
    >['goToAnnotationFromDashboardSidebar'] = async (
        { tab },
        { fullPageUrl, annotationCacheId },
    ) => {
        await this.doSomethingInNewTab(fullPageUrl, async (tabId) => {
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
        })
    }

    private handleHistoryStateUpdate = async ({
        tabId,
    }: WebNavigation.OnHistoryStateUpdatedDetailsType) => {
        const isSidebarEnabled = await getSidebarState()
        if (!isSidebarEnabled) {
            return
        }

        const inPage = runInTab<InPageUIContentScriptRemoteInterface>(tabId)

        await inPage.removeHighlights()
        await inPage.reloadRibbon()
    }
}
