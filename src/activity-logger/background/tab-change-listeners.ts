import { browser, Storage, Tabs, Browser } from 'webextension-polyfill-ts'
import throttle from 'lodash/throttle'

import {
    TabEventChecker,
    whenPageDOMLoaded,
    whenTabActive,
} from '../../util/tab-events'
import PageVisitLogger from './log-page-visit'
import {
    fetchFavIcon,
    FavIconFetchError,
} from '../../page-analysis/background/get-fav-icon'
import { shouldLogTab, updateVisitInteractionData } from './util'
import { TabManager } from './tab-manager'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../../options/settings/constants'
import {
    TabChangeListener,
    LoggableTabChecker,
    VisitInteractionUpdater,
    FavIconFetcher,
    BookmarkChecker,
    TabIndexer,
} from './types'
import { SearchIndex } from 'src/search'
import { getDefaultState } from 'src/overview/onboarding/screens/onboarding/default-state'
import { PageAnalysis } from 'src/page-analysis/background'
import * as Raven from 'src/util/raven'

export default class TabChangeListeners {
    /**
     * `tabs.onUpdated` event fires on tab open - generally takes a few ms,
     * which we can skip attemping visit update.
     */
    static FAUX_VISIT_THRESHOLD = 100
    static FAV_ICON_CHANGE_THRESHOLD = 200
    static URL_CHANGE_THRESHOLD = 1000
    static DEF_CONTENT_SCRIPTS = [
        '/lib/browser-polyfill.js',
        '/content_script.js',
    ]

    private _contentScriptPaths: string[]
    private _tabManager: TabManager
    private _searchIndex: SearchIndex
    private _storage: Storage.StorageArea
    private _checkTabLoggable: LoggableTabChecker
    private _updateTabVisit: VisitInteractionUpdater
    private _fetchFavIcon: FavIconFetcher
    private _pageDOMLoaded: TabEventChecker
    private _tabActive: TabEventChecker
    private _pageVisitLogger: PageVisitLogger
    public checkBookmark: BookmarkChecker

    /**
     * Handles throttled indexing of the tab contents on tab updates.
     * Each tab gets an object of throttled indexers to handle indexing of
     * things such as the fav-icon and visit.
     *
     * TODO: should this be integrated with the ext-wide tab state manager?
     */
    private tabIndexers = new Map<
        number,
        { favIcon: TabIndexer; page: TabIndexer }
    >()

    constructor(options: {
        tabManager: TabManager
        pageVisitLogger: PageVisitLogger
        browserAPIs: Pick<Browser, 'storage'>
        searchIndex: SearchIndex
        storageArea?: Storage.StorageArea
        favIconFetch?: FavIconFetcher
        domLoadCheck?: TabEventChecker
        tabActiveCheck?: TabEventChecker
        loggableTabCheck?: LoggableTabChecker
        contentScriptPaths?: string[]
    }) {
        this._tabManager = options.tabManager
        this._pageVisitLogger = options.pageVisitLogger
        this._storage = options.storageArea || options.browserAPIs.storage.local
        this._searchIndex = options.searchIndex
        this._checkTabLoggable = options.loggableTabCheck || shouldLogTab
        this._updateTabVisit = updateVisitInteractionData
        this._fetchFavIcon = options.favIconFetch || fetchFavIcon
        this._pageDOMLoaded = options.domLoadCheck || whenPageDOMLoaded
        this._tabActive = options.tabActiveCheck || whenTabActive
        this._contentScriptPaths =
            options.contentScriptPaths || TabChangeListeners.DEF_CONTENT_SCRIPTS

        this.checkBookmark = options.searchIndex.pageHasBookmark
    }

    private getOrCreateTabIndexers(tabId: number) {
        let indexers = this.tabIndexers.get(tabId)

        if (!indexers) {
            this.tabIndexers.set(tabId, {
                favIcon: throttle(
                    tab => this._handleFavIcon(tabId, {}, tab),
                    TabChangeListeners.FAV_ICON_CHANGE_THRESHOLD,
                    { leading: false },
                ),
                page: throttle(
                    tab =>
                        this._handleVisitIndexing(tabId, tab).catch(err => {
                            Raven.captureException(err)
                        }),
                    TabChangeListeners.URL_CHANGE_THRESHOLD,
                    { leading: false },
                ),
            })
            indexers = this.tabIndexers.get(tabId)
        }

        return indexers
    }

    handleFavIcon: TabChangeListener = (tabId, _, tab) =>
        this.getOrCreateTabIndexers(tabId).favIcon(tab)

    handleVisitIndexing: TabChangeListener = (tabId, _, tab) =>
        this.getOrCreateTabIndexers(tabId).page(tab)

    /**
     * Handles fetching of user indexing preferences from underyling browser storage.
     */
    private async fetchIndexingPrefs(): Promise<{
        shouldLogStubs: boolean
        shouldLogVisits: boolean
        shouldCaptureScreenshots: boolean
        logDelay: number
    }> {
        const defs = getDefaultState()

        const storage = await this._storage.get({
            [IDXING_PREF_KEYS.STUBS]: defs.areStubsEnabled,
            [IDXING_PREF_KEYS.VISITS]: defs.areVisitsEnabled,
            [IDXING_PREF_KEYS.SCREENSHOTS]: defs.areScreenshotsEnabled,
            [IDXING_PREF_KEYS.VISIT_DELAY]: defs.visitDelay,
        })

        return {
            shouldLogStubs: !!storage[IDXING_PREF_KEYS.STUBS],
            shouldLogVisits: !!storage[IDXING_PREF_KEYS.VISITS],
            shouldCaptureScreenshots: false,
            logDelay: storage[IDXING_PREF_KEYS.VISIT_DELAY],
        }
    }

    private handleVisitEnd: TabChangeListener = async (
        tabId,
        { url },
        { active, status },
    ) => {
        // Check if new URL of tab has an assoc. bookmark or not
        const isBookmarked = await this.checkBookmark(url)

        // Ensures the URL change counts as a new visit in tab state (tab ID doesn't change)
        const oldTab = this._tabManager.resetTab(tabId, {
            url,
            isBookmarked,
            isActive: active,
            isLoaded: status === 'complete',
        })

        // Update that prev. visit's tab state, if active long enough
        if (
            oldTab != null &&
            oldTab.url !== url &&
            oldTab.activeTime > TabChangeListeners.FAUX_VISIT_THRESHOLD
        ) {
            await this._updateTabVisit(oldTab, this._searchIndex)
        }
    }

    public async injectContentScripts(tab: Tabs.Tab) {
        const isLoggable = await this._checkTabLoggable(tab)

        if (!isLoggable) {
            return
        }

        for (const file of this._contentScriptPaths) {
            await browser.tabs.executeScript(tab.id, { file })
        }
    }

    /**
     * Handles scheduling the main page indexing logic that happens on browser tab URL change,
     * and updating the internally held tab manager state.
     */
    public handleUrl: TabChangeListener = async (tabId, { url }, tab) => {
        try {
            if (!(await this._checkTabLoggable(tab))) {
                return
            }

            await this.handleVisitEnd(tabId, { url }, tab)
            await this.handleVisitIndexing(tabId, { url }, tab)
        } catch (err) {
            console.error(err)
        }
    }

    private async logTabWhenActive(
        tab: Tabs.Tab,
        preparation: PageAnalysis,
        skipStubLog?: boolean,
    ) {
        await this._tabActive({ tabId: tab.id })

        const indexingPrefs = await this.fetchIndexingPrefs()

        if (!indexingPrefs.shouldLogStubs && !indexingPrefs.shouldLogVisits) {
            return
        }

        return this._pageVisitLogger.logPageVisit(
            tab,
            preparation,
            !skipStubLog && indexingPrefs.shouldLogStubs,
        )
    }

    _handleVisitIndexing = async (
        tabId: number,
        tab: Tabs.Tab,
        opts: { skipStubLog?: boolean } = {},
    ) => {
        const indexingPrefs = await this.fetchIndexingPrefs()

        let preparation: PageAnalysis
        try {
            preparation = await this._pageVisitLogger.preparePageLogging({
                tab,
                allowScreenshot: indexingPrefs.shouldCaptureScreenshots,
            })
        } catch (err) {
            Raven.captureException(err)
            return
        }

        // Run stage 1 of visit indexing immediately (depends on user settings)
        if (!opts.skipStubLog && indexingPrefs.shouldLogStubs) {
            try {
                await this._pageVisitLogger.logPageStub(tab, preparation)
            } catch (err) {
                Raven.captureException(err)
                return
            }
        }

        // Schedule stage 2 of visit indexing soon after - if user stays on page
        if (indexingPrefs.shouldLogVisits) {
            await this._tabManager.scheduleTabLog(
                tabId,
                () => this.logTabWhenActive(tab, preparation, opts.skipStubLog),
                opts.skipStubLog ? 0 : indexingPrefs.logDelay,
            )
        }
    }

    private _handleFavIcon: TabChangeListener = async (tabId, _, tab) => {
        try {
            if (
                (await this._checkTabLoggable(tab)) &&
                !(await this._searchIndex.domainHasFavIcon(tab.url))
            ) {
                const favIconDataUrl = await this._fetchFavIcon(tab.favIconUrl)
                await this._searchIndex.addFavIcon(tab.url, favIconDataUrl)
            }
        } catch (err) {
            if (!(err instanceof FavIconFetchError)) {
                throw err
            }
        }
    }
}
