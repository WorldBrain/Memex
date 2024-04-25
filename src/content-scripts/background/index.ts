import type { ContentScriptsInterface } from './types'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import type { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import type { Tabs, Browser } from 'webextension-polyfill'
import delay from 'src/util/delay'
import { openPDFInViewer } from 'src/pdf/util'
import { doesUrlPointToPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import { sleepPromise } from 'src/util/promises'
import type { ContentSharingClientStorage } from 'src/content-sharing/background/storage'
import { isUrlYTVideo } from '@worldbrain/memex-common/lib/utils/youtube-url'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { isUrlSupported } from 'src/page-indexing/utils'

export class ContentScriptsBackground {
    remoteFunctions: ContentScriptsInterface<'provider' | 'caller'>

    constructor(
        private options: {
            waitForSync: () => Promise<void>
            contentSharingStorage: ContentSharingClientStorage
            injectScriptInTab: (tabId: number, file: string) => Promise<void>
            browserAPIs: Pick<
                Browser,
                'tabs' | 'storage' | 'runtime' | 'webNavigation'
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
            openBetaFeatureSettings: async (_, { email, userId }) => {
                const isStaging =
                    process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes(
                        'staging',
                    ) || process.env.NODE_ENV === 'development'
                const baseUrl = isStaging
                    ? CLOUDFLARE_WORKER_URLS.staging
                    : CLOUDFLARE_WORKER_URLS.production

                const response = await fetch(
                    baseUrl + '/check_rabbithole_beta_status',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            email: email,
                            userId: userId,
                        }),
                        headers: { 'Content-Type': 'application/json' },
                    },
                )

                return await response.json()
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
            async ({ tabId, url }) => {
                if (isUrlSupported({ fullUrl: url })) {
                    await runInTab<InPageUIContentScriptRemoteInterface>(
                        tabId,
                    ).handleHistoryStateUpdate(tabId)
                }
            },
        )

        this.options.browserAPIs.tabs.onUpdated.addListener(
            (tabId, changeInfo) => {
                if (changeInfo?.url?.includes('mail.google.com/mail')) {
                    runInTab<InPageUIContentScriptRemoteInterface>(
                        tabId,
                    ).handleHistoryStateUpdate(tabId)
                }
                if (isUrlYTVideo(changeInfo?.url)) {
                    this.options.browserAPIs.tabs.sendMessage(tabId, {
                        type: 'URL_CHANGE',
                        url: changeInfo?.url,
                    })
                }
            },
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
        delayBeforeExecution = 1000,
    ) {
        let activeTab: Tabs.Tab
        if (doesUrlPointToPdf(fullPageUrl)) {
            await openPDFInViewer(fullPageUrl, {
                tabsAPI: this.options.browserAPIs.tabs,
                runtimeAPI: this.options.browserAPIs.runtime,
            })
            const activeTabArray = await this.options.browserAPIs.tabs.query({
                currentWindow: true,
                active: true,
            })
            activeTab = activeTabArray[0] ?? null
        } else {
            activeTab = await this.options.browserAPIs.tabs.create({
                active: true,
                url: fullPageUrl,
            })
        }

        const listener = async (
            tabId: number,
            changeInfo: Tabs.OnUpdatedChangeInfoType,
        ) => {
            if (tabId === activeTab?.id && changeInfo.status === 'complete') {
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
                    this.options.browserAPIs.tabs.onUpdated.removeListener(
                        listener,
                    )
                }
            }
        }

        this.options.browserAPIs.tabs.onUpdated.addListener(listener)
    }

    reloadTab: ContentScriptsInterface<'provider'>['reloadTab'] = async (
        { tab },
        { bypassCache },
    ) => {
        await this.options.browserAPIs.tabs.reload(tab.id, { bypassCache })
    }

    openPdfInViewer: ContentScriptsInterface<
        'provider'
    >['openPdfInViewer'] = async ({ tab }, { fullPageUrl }) => {
        await openPDFInViewer(fullPageUrl, {
            tabsAPI: this.options.browserAPIs.tabs,
            runtimeAPI: this.options.browserAPIs.runtime,
        })
    }

    openPageWithSidebarInSelectedListMode: ContentScriptsInterface<
        'provider'
    >['openPageWithSidebarInSelectedListMode'] = async (
        { tab },
        { fullPageUrl, sharedListId, manuallyPullLocalListData },
    ) => {
        if (manuallyPullLocalListData && sharedListId != null) {
            // Doing this to give a bit of time for the Firestore listener/FCM messages to trigger extension sync so it can receive any assumed data.
            //  Main case: web UI reader auto-opens page in extension on page-link list join - joined list data needs to be DL'd locally for UI state to set up
            let retries = 5
            while (retries-- > 0) {
                await sleepPromise(1000)
                await this.options.waitForSync()
                const existing = await this.options.contentSharingStorage.getRemoteListShareMetadata(
                    {
                        remoteListId: sharedListId,
                    },
                )
                if (existing != null) {
                    break
                }
            }
        }

        const allTabs = await this.options.browserAPIs.tabs.query({
            currentWindow: true,
            active: true,
        })

        await this.doSomethingInNewTab(
            fullPageUrl,
            async (tabId) => {
                await runInTab<InPageUIContentScriptRemoteInterface>(
                    tabId,
                ).showSidebar({
                    action: 'selected_list_mode_from_web_ui',
                    sharedListId,
                    manuallyPullLocalListData,
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
