import update from 'immutability-helper'
import { Tabs } from 'webextension-polyfill-ts'
import moment from 'moment'

import { TabManager } from './tab-manager'
// @ts-ignore
import analyzePage, {
    PageAnalyzer,
    PageAnalysis,
} from '../../page-analysis/background'

import { FavIconChecker } from './types'
import { SearchIndex, PageDoc } from 'src/search'

interface Props {
    tabManager: TabManager
    searchIndex: SearchIndex
    momentLib?: typeof moment
    favIconCheck?: FavIconChecker
    pageAnalyzer?: PageAnalyzer
}
type PageLoggingPreparation = PageAnalysis

export default class PageVisitLogger {
    private _tabManager: TabManager
    private _checkFavIcon: FavIconChecker
    private _analyzePage: PageAnalyzer
    private _addPageTerms: SearchIndex['addPageTerms']
    private _createPage: SearchIndex['addPage']
    private _fetchPage: SearchIndex['getPage']
    private _createVisit: SearchIndex['addVisit']
    private _moment: typeof moment

    constructor({
        tabManager,
        searchIndex,
        pageAnalyzer = analyzePage,
        momentLib = moment,
    }: Props) {
        this._tabManager = tabManager
        this._analyzePage = pageAnalyzer
        this._fetchPage = searchIndex.getPage
        this._addPageTerms = searchIndex.addPageTerms
        this._createPage = searchIndex.addPage
        this._createVisit = searchIndex.addVisit
        this._checkFavIcon = searchIndex.domainHasFavIcon
        this._moment = momentLib
    }

    async preparePageLogging(params: {
        tab: Tabs.Tab
        allowScreenshot: boolean
    }): Promise<PageLoggingPreparation | null> {
        const internalTabState = this._tabManager.getTabState(params.tab.id)
        if (internalTabState == null) {
            return null
        }

        const allowFavIcon = !(await this._checkFavIcon(params.tab.url))
        try {
            const analysisRes = await this._analyzePage({
                tabId: params.tab.id,
                allowFavIcon,
                allowScreenshot: params.allowScreenshot,
            })
            return analysisRes
        } catch (err) {
            console.error(err)
            return null
        }
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
        const internalTabState = this._tabManager.getTabState(tab.id)

        // Cannot process if tab not tracked
        if (internalTabState == null) {
            return
        }

        try {
            const existingPage = await this._fetchPage(tab.url)

            if (existingPage != null) {
                // Store just new visit if existing page has been indexed recently (`secsSinceLastIndex`)
                //  also clear scheduled content indexing
                if (
                    this._moment(existingPage.latest).isAfter(
                        this._moment(internalTabState.visitTime).subtract(
                            secsSinceLastVisit,
                            'seconds',
                        ),
                    )
                ) {
                    this._tabManager.clearScheduledLog(tab.id)

                    return this._createVisit(
                        tab.url,
                        internalTabState.visitTime,
                    )
                }
            }

            // Don't index full-text in this stage
            const pageDoc: PageDoc = {
                url: tab.url,
                ...update(pageAnalysis, {
                    content: { $unset: ['fullText'] },
                    $unset: ['getFullText'],
                }),
            }

            await this._createPage({
                pageDoc,
                visits: [internalTabState.visitTime],
                rejectNoContent: false,
            })
        } catch (err) {
            this._tabManager.clearScheduledLog(tab.id)
            throw err
        }
    }

    async logPageVisit(
        tab: Tabs.Tab,
        pageAnalysis: PageLoggingPreparation,
        textOnly = true,
    ) {
        const pageDoc: PageDoc = {
            url: tab.url,
            ...update(pageAnalysis, {
                content: {
                    fullText: {
                        $set:
                            pageAnalysis.content.fullText ||
                            (await pageAnalysis.getFullText()),
                    },
                },
                $unset: ['getFullText'],
            }),
        }

        if (textOnly) {
            return this._addPageTerms({ pageDoc })
        }

        const internalTabState = this._tabManager.getTabState(tab.id)

        // Cannot process if tab not tracked
        if (internalTabState == null) {
            return
        }

        await this._createPage({
            pageDoc,
            visits: [internalTabState.visitTime],
        })
    }
}
