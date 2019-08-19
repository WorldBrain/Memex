import { Runtime, WebNavigation, Tabs, Browser } from 'webextension-polyfill-ts'

import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { mapChunks } from 'src/util/chunk'
import initPauser from './pause-logging'
import { updateVisitInteractionData } from './util'
import { TabManager } from './tab-manager'
import { TabChangeListener } from './types'
import TabChangeListeners from './tab-change-listeners'
import PageVisitLogger from './log-page-visit'
import { CONCURR_TAB_LOAD } from '../constants'

export default class ActivityLoggerBackground {
    static SCROLL_UPDATE_FN = 'updateScrollState'

    tabManager: TabManager
    private tabsAPI: Tabs.Static
    private runtimeAPI: Runtime.Static
    private webNavAPI: WebNavigation.Static
    private tabChangeListener: TabChangeListeners
    private pageVisitLogger: PageVisitLogger
    private toggleLoggingPause = initPauser()

    /**
     * Used to stop of tab updated event listeners while the
     * tracking of existing tabs is happening.
     */
    private tabQueryP = new Promise(resolve => resolve())

    constructor(options: {
        browserAPIs: Pick<
            Browser,
            'tabs' | 'runtime' | 'webNavigation' | 'storage'
        >
    }) {
        this.tabManager = new TabManager()
        this.tabsAPI = options.browserAPIs.tabs
        this.runtimeAPI = options.browserAPIs.runtime
        this.webNavAPI = options.browserAPIs.webNavigation

        this.pageVisitLogger = new PageVisitLogger({
            tabManager: this.tabManager,
        })
        this.tabChangeListener = new TabChangeListeners({
            tabManager: this.tabManager,
            pageVisitLogger: this.pageVisitLogger,
            browserAPIs: options.browserAPIs,
        })
    }

    static isTabLoaded = (tab: Tabs.Tab) => tab.status === 'complete'

    setupRemoteFunctions() {
        makeRemotelyCallable({
            toggleLoggingPause: this.toggleLoggingPause,
            fetchTab: id => this.tabManager.getTabState(id),
            fetchTabByUrl: url => this.tabManager.getTabStateByUrl(url),
        })
    }

    setupWebExtAPIHandlers() {
        this.setupScrollStateHandling()
        this.setupNavStateHandling()
        this.setupTabLifecycleHandling()
    }

    async trackExistingTabs({ isNewInstall = false }) {
        let resolveTabQueryP
        this.tabQueryP = new Promise(resolve => (resolveTabQueryP = resolve))
        const tabs = await this.tabsAPI.query({})

        await mapChunks<Tabs.Tab>(tabs, CONCURR_TAB_LOAD, async browserTab => {
            this.tabManager.trackTab(browserTab, {
                isLoaded: ActivityLoggerBackground.isTabLoaded(browserTab),
                isBookmarked: await this.tabChangeListener.checkBookmark(
                    browserTab.url,
                ),
            })

            await this.tabChangeListener
                .injectContentScripts(browserTab)
                .catch(e => e)

            if (!isNewInstall) {
                return
            }

            if (browserTab.url) {
                this.tabChangeListener._handleVisitIndexing(
                    browserTab.id,
                    browserTab,
                    browserTab,
                )
            }
        })

        resolveTabQueryP()
    }

    private async trackNewTab(id: number) {
        const browserTab = await this.tabsAPI.get(id)

        this.tabManager.trackTab(browserTab, {
            isLoaded: ActivityLoggerBackground.isTabLoaded(browserTab),
            isBookmarked: await this.tabChangeListener.checkBookmark(
                browserTab.url,
            ),
        })
    }

    /**
     * Ensure tab scroll states are kept in-sync with scroll events from the content script.
     */
    private setupScrollStateHandling() {
        this.runtimeAPI.onMessage.addListener(
            ({ funcName, ...scrollState }, { tab }) => {
                if (
                    funcName !== ActivityLoggerBackground.SCROLL_UPDATE_FN ||
                    tab == null
                ) {
                    return
                }
                this.tabManager.updateTabScrollState(tab.id, scrollState)
            },
        )
    }

    private setupTabLifecycleHandling() {
        this.tabsAPI.onCreated.addListener(this.tabManager.trackTab)

        this.tabsAPI.onActivated.addListener(async ({ tabId }) => {
            if (!this.tabManager.isTracked(tabId)) {
                await this.trackNewTab(tabId)
            }

            this.tabManager.activateTab(tabId)
        })

        // Runs stage 3 of the visit indexing
        this.tabsAPI.onRemoved.addListener(tabId => {
            // Remove tab from tab tracking state and update the visit with tab-derived metadata
            const tab = this.tabManager.removeTab(tabId)

            if (tab != null) {
                updateVisitInteractionData(tab)
            }
        })
        this.tabsAPI.onUpdated.addListener(this.tabUpdatedListener)
    }

    /**
     * The `webNavigation.onCommitted` event gives us some useful data related to how the navigation event
     * occured (client/server redirect, user typed in address bar, link click, etc.). Might as well keep the last
     * navigation event for each tab in state for later decision making.
     */
    private setupNavStateHandling() {
        this.webNavAPI.onCommitted.addListener(
            ({ tabId, frameId, ...navData }: any) => {
                // Frame ID is always `0` for the main webpage frame, which is what we care about
                if (frameId === 0) {
                    this.tabManager.updateNavState(tabId, {
                        type: navData.transitionType,
                        qualifiers: navData.transitionQualifiers,
                    })
                }
            },
        )
    }

    private tabUpdatedListener: TabChangeListener = async (
        tabId,
        changeInfo,
        tab,
    ) => {
        await this.tabQueryP

        if (changeInfo.status) {
            this.tabManager.setTabLoaded(
                tabId,
                changeInfo.status === 'complete',
            )
        }

        if (changeInfo.favIconUrl) {
            await this.tabChangeListener.handleFavIcon(tabId, changeInfo, tab)
        }

        if (changeInfo.url) {
            await this.tabChangeListener.handleUrl(tabId, changeInfo, tab)
        }
    }
}

export { TabManager }
