import { browser, Bookmarks } from 'webextension-polyfill-ts'

import * as index from '..'
import { Dexie, StorageManager } from '../types'
import SearchStorage from './storage'
import QueryBuilder from '../query-builder'
import { TabManager } from 'src/activity-logger/background'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { PageSearchParams, AnnotSearchParams, AnnotPage } from './types'
import { SearchError, BadTermError, InvalidSearchError } from './errors'

export default class SearchBackground {
    private backend
    private storage: SearchStorage
    private tabMan: TabManager
    private queryBuilderFactory: () => QueryBuilder
    private getDb: () => Promise<Dexie>

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

    constructor({
        storageManager,
        getDb,
        tabMan,
        queryBuilder = () => new QueryBuilder(),
        idx = index,
        bookmarksAPI = browser.bookmarks,
    }: {
        storageManager: StorageManager
        getDb: () => Promise<Dexie>
        queryBuilder?: () => QueryBuilder
        tabMan: TabManager
        idx?: typeof index
        bookmarksAPI?: Bookmarks.Static
    }) {
        this.tabMan = tabMan
        this.getDb = getDb
        this.queryBuilderFactory = queryBuilder
        this.storage = new SearchStorage({
            storageManager,
            legacySearch: idx.fullSearch(getDb),
        })
        this.initBackend(idx)

        // Handle any new browser bookmark actions (bookmark mananger or bookmark btn in URL bar)
        bookmarksAPI.onCreated.addListener(
            this.handleBookmarkCreation.bind(this),
        )
        bookmarksAPI.onRemoved.addListener(
            this.handleBookmarkRemoval.bind(this),
        )
    }

    private initBackend(idx: typeof index) {
        this.backend = {
            addPage: idx.addPage(this.getDb),
            addPageTerms: idx.addPageTerms(this.getDb),
            updateTimestampMeta: idx.updateTimestampMeta(this.getDb),
            addVisit: idx.addVisit(this.getDb),
            addFavIcon: idx.addFavIcon(this.getDb),
            delPages: idx.delPages(this.getDb),
            delPagesByDomain: idx.delPagesByDomain(this.getDb),
            delPagesByPattern: idx.delPagesByPattern(this.getDb),
            addTag: idx.addTag(this.getDb),
            delTag: idx.delTag(this.getDb),
            fetchPageTags: idx.fetchPageTags(this.getDb),
            addBookmark: idx.addBookmark(this.getDb),
            delBookmark: idx.delBookmark(this.getDb),
            pageHasBookmark: idx.pageHasBookmark(this.getDb),
            getPage: idx.getPage(this.getDb),
            grabExistingKeys: idx.grabExistingKeys(this.getDb),
            search: idx.search(this.getDb),
            suggest: idx.suggest(this.getDb),
            extendedSuggest: idx.extendedSuggest(this.getDb),
            getMatchingPageCount: idx.getMatchingPageCount(this.getDb),
            domainHasFavIcon: idx.domainHasFavIcon(this.getDb),
            createPageFromTab: idx.createPageFromTab(this.getDb),
            createPageFromUrl: idx.createPageFromUrl(this.getDb),
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            search: this.backend.search,
            addTag: this.backend.addTag,
            delTag: this.backend.delTag,
            suggest: this.backend.suggest,
            delPages: this.backend.delPages,
            addBookmark: this.backend.addBookmark,
            delBookmark: this.backend.delBookmark,
            fetchPageTags: this.backend.fetchPageTags,
            extendedSuggest: this.backend.extendedSuggest,
            delPagesByDomain: this.backend.delPagesByDomain,
            delPagesByPattern: this.backend.delPagesByPattern,
            getMatchingPageCount: this.backend.getMatchingPageCount,
            searchAnnotations: this.searchAnnotations.bind(this),
            searchPages: this.searchPages.bind(this),
            getAllAnnotations: this.getAllAnnotationsByUrl.bind(this),
        })
    }

    private processSearchParams(
        {
            query,
            domainsInc,
            domainsExc,
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
            .filterDomains(domainsInc)
            .filterExcDomains(domainsExc)
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
            isBlankSearch: !qb.terms.length,
            bookmarksOnly: params.showOnlyBookmarks || params.bookmarksOnly,
            contentTypes,
            limit,
            skip,
        }
    }

    async searchAnnotations(params: AnnotSearchParams) {
        const results = await this.search(
            params,
            this.storage.searchAnnotsByDay.bind(this.storage),
        )

        return SearchBackground.shapePageResult(results, params.limit, {
            isAnnotsSearch: true,
        })
    }

    async searchPages(params: PageSearchParams) {
        const results = await this.search(
            params,
            this.storage.searchPages.bind(this.storage),
        )

        return SearchBackground.shapePageResult(results, params.limit, {
            isAnnotsSearch: true,
        })
    }

    async search(params: any, searchMethod: (params: any) => Promise<any[]>) {
        let searchParams

        try {
            searchParams = this.processSearchParams(params)
        } catch (e) {
            return SearchBackground.handleSearchError(e)
        }

        return searchMethod(searchParams)
    }

    async getAllAnnotationsByUrl(
        url: string,
        { limit = 10, skip = 0, ...params }: AnnotSearchParams = {
            limit: 10,
            skip: 0,
        },
    ) {
        return this.storage.getAllAnnotationsByUrl({
            url,
            limit,
            skip,
            ...params,
        })
    }

    async handleBookmarkRemoval(id, { node }) {
        // Created folders won't have `url`; ignore these
        if (!node.url) {
            return
        }

        return this.backend.delBookmark(node).catch(console.error)
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

        return this.backend.addBookmark({ url: node.url, tabId })
    }
}
