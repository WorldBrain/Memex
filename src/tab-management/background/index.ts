import { Runtime, WebNavigation, Tabs, Browser } from 'webextension-polyfill-ts'

import * as Raven from 'src/util/raven'
import { mapChunks } from 'src/util/chunk'
import { CONCURR_TAB_LOAD } from '../constants'
import {
    registerRemoteFunctions,
    remoteFunctionWithExtraArgs,
    remoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'
import { TabManager } from './tab-manager'
import { TabChangeListener, TabManagementInterface } from './types'
import { bindMethod } from 'src/util/functions'
import { resolvablePromise } from 'src/util/resolvable'
import PageStorage from 'src/page-indexing/background/storage'
import BookmarksBackground from 'src/bookmarks/background'
import { SearchIndex } from 'src/search'
import { RawPageContent } from 'src/page-analysis/types'

export default class TabManagementBackground {
    static SCROLL_UPDATE_FN = 'updateScrollState'

    tabManager: TabManager
    remoteFunctions: TabManagementInterface<'provider'>
    _indexableTabs: { [tabId: number]: true } = {}

    /**
     * Used to stop of tab updated event listeners while the
     * tracking of existing tabs is happening.
     */
    private trackingExistingTabs = resolvablePromise()

    constructor(
        private options: {
            bookmarksBG: BookmarksBackground
            tabManager: TabManager
            pageStorage: PageStorage
            searchIndex: Pick<SearchIndex, 'pageHasBookmark'>
            browserAPIs: Pick<
                Browser,
                'tabs' | 'runtime' | 'webNavigation' | 'storage'
            >
            extractRawPageContent(tabId: number): Promise<RawPageContent>
        },
    ) {
        this.tabManager = options.tabManager
        this.remoteFunctions = {
            fetchTab: remoteFunctionWithoutExtraArgs(
                this.tabManager.getTabState,
            ),
            fetchTabByUrl: remoteFunctionWithoutExtraArgs(
                this.tabManager.getTabStateByUrl,
            ),
            setTabAsIndexable: remoteFunctionWithExtraArgs(
                this.setTabAsIndexable,
            ),
        }
    }

    static isTabLoaded = (tab: Tabs.Tab) => tab.status === 'complete'

    setupRemoteFunctions() {
        registerRemoteFunctions(this.remoteFunctions)
    }

    setupWebExtAPIHandlers() {
        this.setupScrollStateHandling()
        this.setupNavStateHandling()
        this.setupTabLifecycleHandling()
    }

    setTabAsIndexable: TabManagementInterface<
        'provider'
    >['setTabAsIndexable']['function'] = async ({ tab }) => {
        this._indexableTabs[tab.id] = true
    }

    async extractRawPageContent(tabId: number): Promise<RawPageContent> {
        return this.options.extractRawPageContent(tabId)
    }

    async trackExistingTabs() {
        const tabs = await this.options.browserAPIs.tabs.query({})
        const tabBookmarks = await this.options.bookmarksBG.findTabBookmarks(
            tabs,
        )

        await mapChunks(tabs, CONCURR_TAB_LOAD, async (tab) => {
            this.tabManager.trackTab(tab, {
                isLoaded: TabManagementBackground.isTabLoaded(tab),
                isBookmarked: tabBookmarks.get(tab.url),
            })
        })

        this.trackingExistingTabs.resolve()
    }

    private async trackNewTab(id: number) {
        const browserTab = await this.options.browserAPIs.tabs.get(id)

        this.tabManager.trackTab(browserTab, {
            isLoaded: TabManagementBackground.isTabLoaded(browserTab),
            isBookmarked: await this.options.searchIndex.pageHasBookmark(
                browserTab.url,
            ),
        })
    }

    /**
     * Ensure tab scroll states are kept in-sync with scroll events from the content script.
     */
    private setupScrollStateHandling() {
        this.options.browserAPIs.runtime.onMessage.addListener(
            ({ funcName, ...scrollState }, { tab }) => {
                if (
                    funcName !== TabManagementBackground.SCROLL_UPDATE_FN ||
                    tab == null
                ) {
                    return
                }
                this.tabManager.updateTabScrollState(tab.id, scrollState)
            },
        )
    }

    private setupTabLifecycleHandling() {
        this.options.browserAPIs.tabs.onCreated.addListener(
            this.tabManager.trackTab,
        )

        this.options.browserAPIs.tabs.onActivated.addListener(
            async ({ tabId }) => {
                if (!this.tabManager.isTracked(tabId)) {
                    await this.trackNewTab(tabId)
                }

                this.tabManager.activateTab(tabId)
            },
        )

        this.options.browserAPIs.tabs.onRemoved.addListener((tabId) => {
            const tab = this.tabManager.removeTab(tabId)
            delete this._indexableTabs[tabId]

            if (tab != null) {
                // TODO: Call something when tab is closed
            }
        })
        this.options.browserAPIs.tabs.onUpdated.addListener(
            this.tabUpdatedListener,
        )
    }

    /**
     * The `webNavigation.onCommitted` event gives us some useful data related to how the navigation event
     * occured (client/server redirect, user typed in address bar, link click, etc.). Might as well keep the last
     * navigation event for each tab in state for later decision making.
     */
    private setupNavStateHandling() {
        this.options.browserAPIs.webNavigation.onCommitted.addListener(
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
        await this.trackingExistingTabs

        if (changeInfo.status) {
            this.tabManager.setTabLoaded(
                tabId,
                changeInfo.status === 'complete',
            )
        }
    }
}
