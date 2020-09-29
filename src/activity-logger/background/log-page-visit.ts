import update from 'immutability-helper'
import { Tabs } from 'webextension-polyfill-ts'
import moment from 'moment'

import { TabManager } from '../../tab-management/background/tab-manager'
// @ts-ignore
import analyzePage, {
    PageAnalyzer,
    PageAnalysis,
} from '../../page-analysis/background/analyse-page'

import { FavIconChecker } from './types'
import { SearchIndex, PageDoc } from 'src/search'
import PageStorage from 'src/page-indexing/background/storage'
import { PageIndexingBackground } from 'src/page-indexing/background'

interface Props {
    tabManager: TabManager
    searchIndex: SearchIndex
    pages: PageIndexingBackground
    momentLib?: typeof moment
    favIconCheck?: FavIconChecker
    pageAnalyzer?: PageAnalyzer
}
type PageLoggingPreparation = PageAnalysis

export default class PageVisitLogger {
    private _tabManager: TabManager
    private _checkFavIcon: FavIconChecker
    private _analyzePage: PageAnalyzer
    private _addPageTerms: PageIndexingBackground['addPageTerms']
    private _createPage: PageIndexingBackground['addPage']
    private _fetchPage: SearchIndex['getPage']
    private _createVisit: PageIndexingBackground['addVisit']
    private _pageStorage: PageStorage
    private _moment: typeof moment

    constructor({
        tabManager,
        searchIndex,
        pages,
        pageAnalyzer = analyzePage,
        momentLib = moment,
    }: Props) {
        this._tabManager = tabManager
        this._analyzePage = pageAnalyzer
        this._fetchPage = searchIndex.getPage
        this._addPageTerms = pages.addPageTerms
        this._createPage = pages.addPage
        this._createVisit = pages.addVisit
        this._checkFavIcon = pages.domainHasFavIcon
        this._pageStorage = pages.storage
        this._moment = momentLib
    }

    /**
     * Performs page data indexing for a browser tab. Immediately
     * indexes display data, and searchable title/URL terms, but returns
     * an async callback for manual invocation of text indexing.
     */
    async logPageStub(
        tab: Tabs.Tab,
        pageAnalysis: PageLoggingPreparation,
        secsSinceLastVisit = 20,
    ) {
        // const internalTabState = this._tabManager.getTabState(tab.id)
        // // Cannot process if tab not tracked
        // if (internalTabState == null) {
        //     return
        // }
        // try {
        //     const latestVisit = await this._pageStorage.getLatestVisit(tab.url)
        //     if (latestVisit) {
        //         // Store just new visit if existing page has been indexed recently (`secsSinceLastIndex`)
        //         //  also clear scheduled content indexing
        //         if (
        //             this._moment(latestVisit.time).isAfter(
        //                 this._moment(internalTabState.visitTime).subtract(
        //                     secsSinceLastVisit,
        //                     'seconds',
        //                 ),
        //             )
        //         ) {
        //             this._tabManager.clearScheduledLog(tab.id)
        //             return this._createVisit(
        //                 tab.url,
        //                 internalTabState.visitTime,
        //             )
        //         }
        //     }
        //     // Don't index full-text in this stage
        //     const pageDoc: PageDoc = {
        //         url: tab.url,
        //         ...update(pageAnalysis, {
        //             content: { $unset: ['fullText'] },
        //             $unset: ['getFullText'],
        //         }),
        //     }
        //     await this._createPage({
        //         pageDoc,
        //         visits: [internalTabState.visitTime],
        //         rejectNoContent: false,
        //     })
        // } catch (err) {
        //     this._tabManager.clearScheduledLog(tab.id)
        //     throw err
        // }
    }

    async logPageVisit(
        tab: Tabs.Tab,
        pageAnalysis: PageLoggingPreparation,
        textOnly = true,
    ) {
        // const pageDoc: PageDoc = {
        //     url: tab.url,
        //     ...update(pageAnalysis, {
        //         content: {
        //             fullText: {
        //                 $set:
        //                     pageAnalysis.content.fullText ||
        //                     (await pageAnalysis.getFullText()),
        //             },
        //         },
        //         $unset: ['getFullText'],
        //     }),
        // }
        // if (textOnly) {
        //     return this._addPageTerms({ pageDoc })
        // }
        // const internalTabState = this._tabManager.getTabState(tab.id)
        // // Cannot process if tab not tracked
        // if (internalTabState == null) {
        //     return
        // }
        // await this._createPage({
        //     pageDoc,
        //     visits: [internalTabState.visitTime],
        // })
    }
}
