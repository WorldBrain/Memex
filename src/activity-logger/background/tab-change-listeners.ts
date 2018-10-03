import { browser, Storage, Tabs } from 'webextension-polyfill-ts'
import debounce from 'lodash/debounce'

import * as searchIndex from '../../search'
import {
    TabEventChecker,
    whenPageDOMLoaded,
    whenTabActive,
} from '../../util/tab-events'
import PageVisitLogger from './log-page-visit'
import { fetchFavIcon } from '../../page-analysis/background/get-fav-icon'
import { shouldLogTab, updateVisitInteractionData } from './util'
import { TabManager } from './tab-manager'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../../options/settings/constants'
import {
    TabChangeListener,
    LoggableTabChecker,
    VisitInteractionUpdater,
    FavIconFetcher,
    FavIconChecker,
    FavIconCreator,
    BookmarkChecker,
} from './types'

interface Props {
    tabManager: TabManager
    pageVisitLogger: PageVisitLogger
    storageArea?: Storage.StorageArea
    visitUpdate?: VisitInteractionUpdater
    favIconFetch?: FavIconFetcher
    favIconCheck?: FavIconChecker
    domLoadCheck?: TabEventChecker
    favIconCreate?: FavIconCreator
    bookmarkCheck?: BookmarkChecker
    tabActiveCheck?: TabEventChecker
    loggableTabCheck?: LoggableTabChecker
    contentScriptPaths?: string[]
}

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
    private _storage: Storage.StorageArea
    private _checkTabLoggable: LoggableTabChecker
    private _updateTabVisit: VisitInteractionUpdater
    private _fetchFavIcon: FavIconFetcher
    private _checkFavIcon: FavIconChecker
    private _createFavIcon: FavIconCreator
    private _pageDOMLoaded: TabEventChecker
    private _tabActive: TabEventChecker
    private _pageVisitLogger: PageVisitLogger
    public checkBookmark: BookmarkChecker

    /**
     * Handles fetching, and indexing the fav-icon once the tab updates, if needed.
     */
    handleFavIcon: TabChangeListener
    private handleVisitIndexing: TabChangeListener

    constructor({
        tabManager,
        pageVisitLogger,
        storageArea = browser.storage.local,
        loggableTabCheck = shouldLogTab,
        visitUpdate = updateVisitInteractionData,
        favIconFetch = fetchFavIcon,
        favIconCheck = searchIndex.domainHasFavIcon,
        favIconCreate = searchIndex.addFavIcon,
        domLoadCheck = whenPageDOMLoaded,
        tabActiveCheck = whenTabActive,
        bookmarkCheck = searchIndex.pageHasBookmark,
        contentScriptPaths = TabChangeListeners.DEF_CONTENT_SCRIPTS,
    }: Props) {
        this._tabManager = tabManager
        this._pageVisitLogger = pageVisitLogger
        this._storage = storageArea
        this._checkTabLoggable = loggableTabCheck
        this._updateTabVisit = visitUpdate
        this._fetchFavIcon = favIconFetch
        this._checkFavIcon = favIconCheck
        this._createFavIcon = favIconCreate
        this._pageDOMLoaded = domLoadCheck
        this._tabActive = tabActiveCheck
        this.checkBookmark = bookmarkCheck
        this._contentScriptPaths = contentScriptPaths

        // Set up debounces for different tab change listeners as some sites can
        // really spam the fav-icon changes when they first load and to avoid some URL redirects.
        // TODO: Better ways should exist
        this.handleFavIcon = debounce(
            this._handleFavIcon,
            TabChangeListeners.FAV_ICON_CHANGE_THRESHOLD,
        )

        this.handleVisitIndexing = debounce(
            this._handleVisitIndexing,
            TabChangeListeners.URL_CHANGE_THRESHOLD,
        )
    }

    /**
     * Handles fetching of user indexing preferences from underyling browser storage.
     */
    private async fetchIndexingPrefs(): Promise<{
        shouldLogStubs: boolean
        shouldLogVisits: boolean
        logDelay: number
    }> {
        const storage = await this._storage.get([
            IDXING_PREF_KEYS.STUBS,
            IDXING_PREF_KEYS.VISITS,
            IDXING_PREF_KEYS.VISIT_DELAY,
        ])

        return {
            shouldLogStubs: !!storage[IDXING_PREF_KEYS.STUBS],
            shouldLogVisits: !!storage[IDXING_PREF_KEYS.VISITS],
            logDelay: storage[IDXING_PREF_KEYS.VISIT_DELAY],
        }
    }

    private handleVisitEnd: TabChangeListener = async (
        tabId,
        { url },
        { incognito, active },
    ) => {
        // Check if new URL of tab has an assoc. bookmark or not
        const hasBookmark = await this.checkBookmark(url)

        // Ensures the URL change counts as a new visit in tab state (tab ID doesn't change)
        const oldTab = this._tabManager.resetTab(
            tabId,
            active,
            url,
            hasBookmark,
        )

        // Send off request for updating that prev. visit's tab state, if active long enough
        if (
            oldTab != null &&
            oldTab.url !== url &&
            oldTab.activeTime > TabChangeListeners.FAUX_VISIT_THRESHOLD
        ) {
            await this._updateTabVisit(oldTab)
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

    private _handleVisitIndexing: TabChangeListener = async (tabId, _, tab) => {
        const indexingPrefs = await this.fetchIndexingPrefs()

        // Run stage 1 of visit indexing immediately (depends on user settings)
        await this._pageDOMLoaded({ tabId })
        if (indexingPrefs.shouldLogStubs) {
            await this._pageVisitLogger.logPageStub(tab)
        }

        // Schedule stage 2 of visit indexing soon after - if user stays on page
        if (indexingPrefs.shouldLogVisits) {
            await this._tabManager.scheduleTabLog(
                tabId,
                () =>
                    this._tabActive({ tabId })
                        .then(() =>
                            this._pageVisitLogger.logPageVisit(
                                tab,
                                indexingPrefs.shouldLogStubs,
                            ),
                        )
                        .catch(console.error),
                indexingPrefs.logDelay,
            )
        }
    }

    private _handleFavIcon: TabChangeListener = async (
        tabId,
        { favIconUrl },
        tab,
    ) => {
        try {
            if (
                (await this._checkTabLoggable(tab)) &&
                !(await this._checkFavIcon(tab.url))
            ) {
                const favIconDataUrl = await this._fetchFavIcon(favIconUrl)
                await this._createFavIcon(tab.url, favIconDataUrl)
            }
        } catch (err) {
            console.error(err)
        }
    }
}
