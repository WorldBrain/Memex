import Storex from '@worldbrain/storex'
import { Browser } from 'webextension-polyfill-ts'

// import * as index from '..'
import SearchStorage from './storage'
import QueryBuilder from '../query-builder'
import { TabManager } from 'src/activity-logger/background'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { SearchInterface, BackgroundSearchParams } from './types'
import { SearchError, BadTermError, InvalidSearchError } from './errors'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { SearchIndex } from '../types'
import TagsBackground from 'src/tags/background'
import { PageIndexingBackground } from 'src/page-indexing/background'
import { pageIsStub } from 'src/page-indexing/utils'
import { createPageViaBmTagActs } from '../on-demand-indexing'
import { initErrHandler } from '../storage'

export default class SearchBackground {
    storage: SearchStorage
    searchIndex: SearchIndex
    private tabMan: TabManager
    private queryBuilderFactory: () => QueryBuilder
    public remoteFunctions: {
        bookmarks: BookmarksInterface
        search: SearchInterface
    }

    static handleSearchError(e: SearchError) {
        if (e instanceof BadTermError) {
            return {
                docs: [],
                resultsExhausted: true,
                totalCount: null,
                isBadTerm: true,
            }
        }

        // Default error case
        return {
            docs: [],
            resultsExhausted: true,
            totalCount: null,
            isInvalidSearch: true,
        }
    }

    static shapePageResult(results, limit: number, extra = {}) {
        return {
            resultsExhausted: results.length < limit,
            totalCount: null, // TODO: try to get this implemented
            docs: results,
            ...extra,
        }
    }

    constructor(
        private options: {
            storageManager: Storex
            idx: SearchIndex
            tags: TagsBackground
            pages: PageIndexingBackground
            queryBuilder?: () => QueryBuilder
            tabMan: TabManager
            browserAPIs: Pick<Browser, 'bookmarks'>
        },
    ) {
        this.tabMan = options.tabMan
        this.searchIndex = options.idx
        this.queryBuilderFactory =
            options.queryBuilder || (() => new QueryBuilder())
        this.storage = new SearchStorage({
            storageManager: options.storageManager,
            legacySearch: this.searchIndex.fullSearch,
        })

        // Handle any new browser bookmark actions (bookmark mananger or bookmark btn in URL bar)
        options.browserAPIs.bookmarks.onCreated.addListener(
            this.handleBookmarkCreation.bind(this),
        )
        options.browserAPIs.bookmarks.onRemoved.addListener(
            this.handleBookmarkRemoval.bind(this),
        )

        this.initRemoteFunctions()
    }

    private initRemoteFunctions() {
        this.remoteFunctions = {
            bookmarks: {
                addPageBookmark: this.searchIndex.addBookmark,
                delPageBookmark: this.searchIndex.delBookmark,
            },
            search: {
                search: this.searchIndex.search,
                addPageTag: params => {
                    return this._modifyTag(true, params)
                },
                delPageTag: params => {
                    return this._modifyTag(true, params)
                },
                suggest: this.storage.suggest,
                extendedSuggest: this.storage.suggestExtended,
                delPages: this.searchIndex.delPages,

                fetchPageTags: async (url: string) => {
                    return this.options.tags.storage.fetchPageTags({ url })
                },
                delPagesByDomain: this.searchIndex.delPagesByDomain,
                delPagesByPattern: this.searchIndex.delPagesByPattern,
                getMatchingPageCount: this.searchIndex.getMatchingPageCount,
                searchAnnotations: this.searchAnnotations.bind(this),
                searchPages: this.searchPages.bind(this),
                searchSocial: this.searchSocial.bind(this),
            },
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions.search)
    }

    private processSearchParams(
        {
            query,
            domains,
            domainsExclude,
            tagsInc,
            lists,
            contentTypes = { notes: true, highlights: true, pages: true },
            skip = 0,
            limit = 10,
            ...params
        }: any,
        ignoreBadSearch = false,
    ) {
        // Extract query terms and in-query-filters via QueryBuilder
        const qb = this.queryBuilderFactory()
            .searchTerm(query)
            .filterDomains(domains)
            .filterExcDomains(domainsExclude)
            .filterTags(tagsInc)
            .filterLists(lists)
            .get()

        if (qb.isBadTerm && !ignoreBadSearch) {
            throw new BadTermError()
        }

        if (qb.isInvalidSearch && !ignoreBadSearch) {
            throw new InvalidSearchError()
        }

        return {
            ...params,
            tagsInc: qb.tags,
            termsInc: qb.terms,
            termsExc: qb.termsExclude,
            domainsInc: qb.domains,
            domainsExc: qb.domainsExclude,
            collections: qb.lists,
            includeNotes: contentTypes.notes,
            includeHighlights: contentTypes.highlights,
            bookmarksOnly: params.showOnlyBookmarks || params.bookmarksOnly,
            contentTypes,
            limit,
            skip,
        }
    }

    async searchAnnotations(params: BackgroundSearchParams) {
        let searchParams

        try {
            searchParams = this.processSearchParams(params)
        } catch (e) {
            return SearchBackground.handleSearchError(e)
        }

        const { docs, annotsByDay }: any = await this.storage.searchAnnots(
            searchParams,
        )

        const extra = annotsByDay
            ? {
                  isAnnotsSearch: true,
                  annotsByDay,
                  resultsExhausted:
                      Object.keys(annotsByDay).length < searchParams.limit,
              }
            : {}

        return SearchBackground.shapePageResult(docs, searchParams.limit, extra)
    }

    async searchPages(params: BackgroundSearchParams) {
        let searchParams

        try {
            searchParams = this.processSearchParams(params)
        } catch (e) {
            return SearchBackground.handleSearchError(e)
        }

        const docs = await this.storage.searchPages(searchParams)

        return SearchBackground.shapePageResult(docs, searchParams.limit)
    }

    async searchSocial(params: BackgroundSearchParams) {
        let searchParams
        try {
            searchParams = this.processSearchParams(params)
        } catch (e) {
            return SearchBackground.handleSearchError(e)
        }

        const docs = await this.storage.searchSocial(searchParams)
        return SearchBackground.shapePageResult(docs, searchParams.limit)
    }

    async handleBookmarkRemoval(id, { node }) {
        // Created folders won't have `url`; ignore these
        if (!node.url) {
            return
        }

        return this.searchIndex.delBookmark(node).catch(console.error)
    }

    async handleBookmarkCreation(id, node) {
        // Created folders won't have `url`; ignore these
        if (!node.url) {
            return
        }

        let tabId
        const activeTab = this.tabMan.getActiveTab()

        if (activeTab != null && activeTab.url === node.url) {
            tabId = activeTab.id
        }

        return this.searchIndex.addBookmark({ url: node.url, tabId })
    }

    async _modifyTag(
        shouldAdd: boolean,
        params: {
            url: string
            tag: string
            tabId?: number
        },
    ) {
        const pageStorage = this.options.pages.storage
        let page = await pageStorage.getPage(params.url)

        if (page == null || pageIsStub(page)) {
            page = await createPageViaBmTagActs(pageStorage)({
                url: params.url,
                tabId: params.tabId,
            })
        }

        // Add new visit if none, else page won't appear in results
        await pageStorage.addPageVisitIfHasNone(page.url, Date.now())

        if (shouldAdd) {
            await this.options.tags.storage
                .addTag({ url: params.url, name: params.tag })
                .catch(initErrHandler())
        } else {
            await this.options.tags.storage
                .delTag({ url: params.url, name: params.tag })
                .catch(initErrHandler())
        }
    }
}
