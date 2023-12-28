import type Storex from '@worldbrain/storex'
import type { Browser } from 'webextension-polyfill'

// import * as index from '..'
import SearchStorage from './storage'
import QueryBuilder from '../query-builder'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import type {
    SearchInterface,
    StandardSearchResponse,
    AnnotationsSearchResponse,
    BackgroundSearchParams,
    AnnotPage,
} from './types'
import { SearchError, BadTermError, InvalidSearchError } from './errors'
import type { SearchIndex } from '../types'
import type { PageIndexingBackground } from 'src/page-indexing/background'
import type BookmarksBackground from 'src/bookmarks/background'
import {
    isMemexPageAPdf,
    pickBestLocator,
} from '@worldbrain/memex-common/lib/page-indexing/utils'
import {
    ContentLocatorType,
    LocationSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { trackSearchExecution } from '@worldbrain/memex-common/lib/analytics/events'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'

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
            analyticsBG: AnalyticsCoreInterface
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

    private async resolvePdfPageFullUrls(
        docs: AnnotPage[],
    ): Promise<AnnotPage[]> {
        const toReturn: AnnotPage[] = []
        for (const doc of docs) {
            if (!isMemexPageAPdf(doc)) {
                toReturn.push(doc)
                continue
            }

            const locators = await this.options.pages.findLocatorsByNormalizedUrl(
                doc.url,
            )
            const mainLocator = pickBestLocator(locators, {
                priority: ContentLocatorType.Remote,
            })

            // If this is an uploaded PDF, we need to flag it for grabbing a temporary access URL when clicked via the `upload_id` param
            if (
                mainLocator &&
                mainLocator.locationScheme === LocationSchemeType.UploadStorage
            ) {
                doc.fullPdfUrl =
                    mainLocator.originalLocation +
                    '?upload_id=' +
                    mainLocator.location
            } else {
                doc.fullPdfUrl = mainLocator?.originalLocation ?? undefined
            }

            toReturn.push(doc)
        }
        return toReturn
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

        let { docs, annotsByDay } = await this.storage.searchAnnots(
            searchParams,
        )

        docs = await this.resolvePdfPageFullUrls(docs)

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

        if (this.options.analyticsBG) {
            try {
                await trackSearchExecution(this.options.analyticsBG)
            } catch (error) {
                console.error(
                    `Error tracking search execution create event', ${error}`,
                )
            }
        }

        try {
            searchParams = this.processSearchParams(params)
        } catch (e) {
            return SearchBackground.handleSearchError(e)
        }

        let docs = await this.storage.searchPages(searchParams)

        docs = await this.resolvePdfPageFullUrls(docs)

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
