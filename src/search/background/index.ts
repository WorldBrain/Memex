import Storex from '@worldbrain/storex'
import { Browser } from 'webextension-polyfill-ts'

// import * as index from '..'
import SearchStorage from './storage'
import QueryBuilder from '../query-builder'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import {
    SearchInterface,
    StandardSearchResponse,
    AnnotationsSearchResponse,
    BackgroundSearchParams,
    AnnotPage,
} from './types'
import { SearchError, BadTermError, InvalidSearchError } from './errors'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { SearchIndex } from '../types'
import { PageIndexingBackground } from 'src/page-indexing/background'
import * as Raven from 'src/util/raven'
import BookmarksBackground from 'src/bookmarks/background'
import { TabManager } from 'src/tab-management/background/tab-manager'

export default class SearchBackground {
    storage: SearchStorage
    searchIndex: SearchIndex
    private queryBuilderFactory: () => QueryBuilder
    public remoteFunctions: {
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

    static shapePageResult(results: AnnotPage[], limit: number, extra = {}) {
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
            pages: PageIndexingBackground
            bookmarks: BookmarksBackground
            queryBuilder?: () => QueryBuilder
            browserAPIs: Pick<Browser, 'bookmarks'>
        },
    ) {
        this.searchIndex = options.idx
        this.queryBuilderFactory =
            options.queryBuilder || (() => new QueryBuilder())
        this.storage = new SearchStorage({
            storageManager: options.storageManager,
            legacySearch: this.searchIndex.fullSearch,
        })

        this.initRemoteFunctions()
    }

    private initRemoteFunctions() {
        this.remoteFunctions = {
            search: {
                search: this.searchIndex.search,
                suggest: this.storage.suggest,
                extendedSuggest: this.storage.suggestExtended,

                delPages: this.options.pages.delPages.bind(this.options.pages),
                delPagesByDomain: this.options.pages.delPagesByDomain.bind(
                    this.options.pages,
                ),
                delPagesByPattern: this.options.pages.delPagesByPattern.bind(
                    this.options.pages,
                ),

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

    async searchAnnotations(
        params: BackgroundSearchParams,
    ): Promise<StandardSearchResponse | AnnotationsSearchResponse> {
        let searchParams

        try {
            searchParams = this.processSearchParams(params)
        } catch (e) {
            return SearchBackground.handleSearchError(e)
        }

        const { docs, annotsByDay } = await this.storage.searchAnnots(
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

    async searchPages(
        params: BackgroundSearchParams,
    ): Promise<StandardSearchResponse> {
        let searchParams

        try {
            searchParams = this.processSearchParams(params)
        } catch (e) {
            return SearchBackground.handleSearchError(e)
        }

        const docs = await this.storage.searchPages(searchParams)

        return SearchBackground.shapePageResult(docs, searchParams.limit)
    }

    async searchSocial(
        params: BackgroundSearchParams,
    ): Promise<StandardSearchResponse> {
        let searchParams
        try {
            searchParams = this.processSearchParams(params)
        } catch (e) {
            return SearchBackground.handleSearchError(e)
        }

        const docs = await this.storage.searchSocial(searchParams)
        return SearchBackground.shapePageResult(docs, searchParams.limit)
    }
}
