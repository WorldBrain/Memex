import type Storex from '@worldbrain/storex'
import type { Browser } from 'webextension-polyfill'
import groupBy from 'lodash/groupBy'
import fromPairs from 'lodash/fromPairs'
import partition from 'lodash/partition'
import SearchStorage from './storage'
import QueryBuilder from '../query-builder'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import type {
    SearchInterface,
    StandardSearchResponse,
    AnnotationsSearchResponse,
    BackgroundSearchParams,
    AnnotPage,
    UnifiedSearchParams,
    UnifiedBlankSearchResult,
    UnifiedBlankSearchParams,
    UnifiedTermsSearchParams,
    PaginationParams,
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
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type {
    Annotation,
    AnnotationListEntry,
    AnnotationPrivacyLevel,
    Bookmark,
    ListEntry,
    Page,
    PageListEntry,
    Visit,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import {
    sortUnifiedBlankSearchResult,
    queryAnnotationsByTerms,
    queryPagesByTerms,
} from './utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { isUrlMemexSupportedVideo } from '@worldbrain/memex-common/lib/utils/youtube-url'

const dayMs = 1000 * 60 * 60 * 24

type UnifiedSearchLookupData = {
    pages: Map<string, Omit<AnnotPage, 'annotations' | 'hasBookmark'>>
    annotations: Map<string, Annotation & { lists: number[] }>
}

export default class SearchBackground {
    storage: SearchStorage
    searchIndex: SearchIndex
    private queryBuilderFactory: () => QueryBuilder
    public remoteFunctions: SearchInterface

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

        this.remoteFunctions = {
            unifiedSearch: this.unifiedSearch,
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
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    private async calcSearchLowestTimeBound(): Promise<number> {
        // Real lower bound (for blank search) would be the time of the oldest bookmark or visit, whichever is oldest
        const oldestTimestamps = (await Promise.all(
            ['visits', 'bookmarks'].map((coll) =>
                this.options.storageManager
                    .collection(coll)
                    .findObject({}, { order: [['time', 'asc']] }),
            ),
        )) as [Visit?, Bookmark?]

        const oldestTimestamp = Math.min(
            ...oldestTimestamps.filter(Boolean).map((t) => t.time),
        )
        return oldestTimestamp !== Infinity ? oldestTimestamp : 0
    }

    private sliceUnifiedSearchResults(
        resultDataByPage: any[],
        { limit, skip }: PaginationParams,
    ): UnifiedBlankSearchResult['resultDataByPage'] {
        // NOTE: Current implementation ignores annotation count, and simply paginates by the number of pages in the results
        return new Map(resultDataByPage.slice(skip, skip + limit))
    }

    private async filterUnifiedSearchResultsByFilters(
        resultDataByPage: UnifiedBlankSearchResult['resultDataByPage'],
        params: UnifiedSearchParams,
    ): Promise<void> {
        if (
            !resultDataByPage.size ||
            (!params.filterByDomains.length &&
                !params.filterByListIds.length &&
                !params.filterPDFs &&
                !params.filterVideos)
        ) {
            return
        }
        const pageIdsToDelete = new Set<string>()

        if (params.filterVideos) {
            resultDataByPage.forEach((_, pageId) => {
                if (!isUrlMemexSupportedVideo(pageId)) {
                    pageIdsToDelete.add(pageId)
                }
            })
        }

        if (params.filterPDFs) {
            resultDataByPage.forEach((_, pageId) => {
                if (!isMemexPageAPdf({ url: pageId })) {
                    pageIdsToDelete.add(pageId)
                }
            })
        }

        // 1. OR'd filter by domains is easy - we already have all the data we need
        if (params.filterByDomains.length) {
            resultDataByPage.forEach((_, pageId) => {
                const isDomainIncluded = params.filterByDomains.reduce(
                    (acc, domain) => {
                        // This allows for subdomains
                        const domainRegexp = new RegExp(`^(\\w+\\.)?${domain}`)
                        return acc || domainRegexp.test(pageId)
                    },
                    false,
                )
                if (!isDomainIncluded) {
                    pageIdsToDelete.add(pageId)
                }
            })
        }
        pageIdsToDelete.forEach((id) => resultDataByPage.delete(id))
        if (!resultDataByPage.size || !params.filterByListIds.length) {
            return
        }

        // 2. AND'd filter by lists is more tricky. First need to lookup annot privacy level data to know whether they inherit parent page lists or not
        const allAnnotIds: string[] = []
        const pageIdByAnnotId = new Map<string, string>()
        resultDataByPage.forEach(({ annotations: annotIds }, pageId) =>
            annotIds.forEach((annot) => {
                allAnnotIds.push(annot.url)
                pageIdByAnnotId.set(annot.url, pageId)
            }),
        )

        const privacyLevels: AnnotationPrivacyLevel[] = await this.options.storageManager
            .collection('annotationPrivacyLevels')
            .findObjects({ annotation: { $in: allAnnotIds } })
        const privacyLevelsByAnnotId = fromPairs(
            privacyLevels.map((p) => [p.annotation, p.privacyLevel]),
        )

        let [
            selectivelySharedAnnotIds,
            autoSharedAnnotIds,
        ] = partition(allAnnotIds, (id) =>
            [
                AnnotationPrivacyLevels.PROTECTED,
                AnnotationPrivacyLevels.PRIVATE,
            ].includes(privacyLevelsByAnnotId[id]),
        )

        const hasEntriesForAllFilteredLists = (
            entries: ListEntry[] = [],
        ): boolean => {
            const listsWithEntries = entries.map((e) => e.listId)
            return params.filterByListIds.reduce(
                (acc, listId) => acc && listsWithEntries.includes(listId),
                true,
            )
        }

        // 3. Filter down selectively-shared annotations
        const annotListEntries: AnnotationListEntry[] = await this.options.storageManager
            .collection('annotListEntries')
            .findObjects({
                listId: { $in: params.filterByListIds },
                url: { $in: selectivelySharedAnnotIds },
            })
        const annotListEntriesByAnnotId = groupBy(
            annotListEntries,
            (e) => e.url,
        )
        selectivelySharedAnnotIds = selectivelySharedAnnotIds.filter((id) =>
            hasEntriesForAllFilteredLists(annotListEntriesByAnnotId[id]),
        )

        // 4. Filter down auto-shared annotations
        const pageListEntries: PageListEntry[] = await this.options.storageManager
            .collection('pageListEntries')
            .findObjects({
                listId: { $in: params.filterByListIds },
                pageUrl: { $in: [...resultDataByPage.keys()] },
            })
        const pageListEntriesByPageId = groupBy(
            pageListEntries,
            (e) => e.pageUrl,
        )
        autoSharedAnnotIds = autoSharedAnnotIds.filter((id) =>
            hasEntriesForAllFilteredLists(
                pageListEntriesByPageId[pageIdByAnnotId.get(id)],
            ),
        )

        // 5. Apply annotation filtering to the results, and filter out any pages not in lists without remaining annotations
        resultDataByPage.forEach((data, pageId) => {
            data.annotations = data.annotations.filter(
                (annot) =>
                    selectivelySharedAnnotIds.includes(annot.url) ||
                    autoSharedAnnotIds.includes(annot.url),
            )
            if (
                !data.annotations.length &&
                !hasEntriesForAllFilteredLists(pageListEntriesByPageId[pageId])
            ) {
                pageIdsToDelete.add(pageId)
            }
        })
        pageIdsToDelete.forEach((id) => resultDataByPage.delete(id))
    }

    private async unifiedBlankSearch(
        params: UnifiedBlankSearchParams,
    ): Promise<UnifiedBlankSearchResult> {
        let upperBound = params.untilWhen ?? Date.now()
        let lowerBound =
            params.fromWhen ?? upperBound - params.daysToSearch * dayMs

        const calcQuery = () => ({ $gt: lowerBound, $lt: upperBound })

        const resultDataByPage: UnifiedBlankSearchResult['resultDataByPage'] = new Map()
        const [annotations, visits, bookmarks] = await Promise.all([
            this.options.storageManager
                .collection('annotations')
                .findObjects({ lastEdited: calcQuery() }) as Promise<
                Annotation[]
            >,
            this.options.storageManager
                .collection('visits')
                .findObjects({ time: calcQuery() }) as Promise<Visit[]>,
            this.options.storageManager
                .collection('bookmarks')
                .findObjects({ time: calcQuery() }) as Promise<Bookmark[]>,
        ])

        // Add in all the annotations to the results
        const annotsByPage = groupBy(annotations, (a) => a.pageUrl)
        for (const [pageId, annots] of Object.entries(annotsByPage)) {
            const sortedAnnots = annots.sort(
                (a, b) => b.lastEdited.valueOf() - a.lastEdited.valueOf(),
            )
            resultDataByPage.set(pageId, {
                annotations: sortedAnnots,
                // This gets overwritten in the next loop by the latest visit/bookmark time (if exist in this results "page")
                latestPageTimestamp: sortedAnnots[0].lastEdited.valueOf(),
            })
        }

        // Add in all the pages to the results
        const descOrdered = [...bookmarks, ...visits].sort(
            (a, b) => a.time - b.time,
        )
        for (const { url, time } of descOrdered) {
            const annotations = resultDataByPage.get(url)?.annotations ?? []
            resultDataByPage.set(url, {
                annotations,
                latestPageTimestamp: time, // Should end up being the latest one, given ordering
            })
        }

        await this.filterUnifiedSearchResultsByFilters(resultDataByPage, params)
        return {
            resultDataByPage,
            resultsExhausted: lowerBound <= params.lowestTimeBound,
            oldestResultTimestamp: lowerBound,
        }
    }

    private async unifiedTermsSearch(
        params: UnifiedTermsSearchParams,
    ): Promise<UnifiedBlankSearchResult> {
        const terms = params.query.split(/\s+/)
        const resultDataByPage: UnifiedBlankSearchResult['resultDataByPage'] = new Map()

        const [pages, annotations] = await Promise.all([
            params.queryPages(terms),
            params.queryAnnotations(terms),
        ])

        // Add in all the annotations to the results
        const annotsByPage = groupBy(annotations, (a) => a.pageUrl)
        for (const [pageId, annots] of Object.entries(annotsByPage)) {
            const sortedAnnots = annots.sort(
                (a, b) => b.lastEdited.valueOf() - a.lastEdited.valueOf(),
            )
            resultDataByPage.set(pageId, {
                annotations: sortedAnnots,
                // This gets overwritten in the next loop by the latest visit/bookmark time (if exist in this results "page")
                latestPageTimestamp: sortedAnnots[0].lastEdited.valueOf(),
            })
        }

        // Add in all the pages to the results
        for (const { url, latestTimestamp } of pages) {
            const annotations = resultDataByPage.get(url)?.annotations ?? []
            resultDataByPage.set(url, {
                annotations,
                latestPageTimestamp: latestTimestamp,
            })
        }

        await this.filterUnifiedSearchResultsByFilters(resultDataByPage, params)

        // Paginate!
        const sortedResultPages = sortUnifiedBlankSearchResult(resultDataByPage)
        const paginatedResults = this.sliceUnifiedSearchResults(
            sortedResultPages,
            params,
        )

        return {
            oldestResultTimestamp: 0,
            resultDataByPage: paginatedResults,
            resultsExhausted: paginatedResults.size < params.limit,
        }
    }

    unifiedSearch: SearchInterface['unifiedSearch'] = async (params) => {
        let result: UnifiedBlankSearchResult
        if (!params.query.trim().length) {
            const lowestTimeBound = await this.calcSearchLowestTimeBound()
            // Skip over days where there's no results, until we get results
            do {
                result = await this.unifiedBlankSearch({
                    ...params,
                    untilWhen:
                        result?.oldestResultTimestamp ?? params.untilWhen,
                    daysToSearch: 1,
                    lowestTimeBound,
                })
            } while (!result.resultsExhausted && !result.resultDataByPage.size)
        } else {
            result = await this.unifiedTermsSearch({
                ...params,
                queryPages: queryPagesByTerms(this.options.storageManager),
                queryAnnotations: queryAnnotationsByTerms(
                    this.options.storageManager,
                ),
            })
        }

        const dataLookups = await this.lookupDataForUnifiedResults(result)
        const sortedResultPages = sortUnifiedBlankSearchResult(
            result.resultDataByPage,
        )
        const mappedAnnotPages = sortedResultPages
            .map(([pageId, { annotations }]) => {
                const page = dataLookups.pages.get(pageId)
                if (!page) {
                    throw new Error(
                        'Search error: Missing page data for search result',
                    )
                }
                return {
                    ...page,
                    annotations: annotations
                        .map((annot) => dataLookups.annotations.get(annot.url))
                        .filter(Boolean),
                }
            })
            .filter(Boolean)

        return {
            docs: mappedAnnotPages,
            resultsExhausted: result.resultsExhausted,
            oldestResultTimestamp: result.oldestResultTimestamp,
        }
    }

    private async lookupDataForUnifiedResults({
        resultDataByPage,
    }: UnifiedBlankSearchResult): Promise<UnifiedSearchLookupData> {
        const lookups: UnifiedSearchLookupData = {
            annotations: new Map(),
            pages: new Map(),
        }

        const pageIds = [...resultDataByPage.keys()]
        const pageData = await this.options.storageManager
            .collection('pages')
            .findObjects<Page>({
                url: { $in: pageIds },
            })

        const annotIds = [
            ...resultDataByPage.values(),
        ].flatMap(({ annotations }) => annotations.map((a) => a.url))
        const annotData = await this.options.storageManager
            .collection('annotations')
            .findObjects<Annotation>({
                url: { $in: annotIds },
            })

        const pageListEntries = await this.options.storageManager
            .collection('pageListEntries')
            .findObjects<PageListEntry>({
                listId: { $ne: SPECIAL_LIST_IDS.INBOX },
                pageUrl: { $in: pageIds },
            })
        const annotListEntries = await this.options.storageManager
            .collection('annotListEntries')
            .findObjects<AnnotationListEntry>({
                listId: { $ne: SPECIAL_LIST_IDS.INBOX },
                url: { $in: annotIds },
            })
        const listIdsByPage = groupBy(pageListEntries, (e) => e.pageUrl)
        const listIdsByAnnot = groupBy(annotListEntries, (e) => e.url)

        pageData.forEach((p) =>
            lookups.pages.set(p.url, {
                ...p,
                lists: (listIdsByPage[p.url] ?? []).map((e) => e.listId),
            }),
        )
        annotData.forEach((a) =>
            lookups.annotations.set(a.url, {
                ...a,
                lists: (listIdsByAnnot[a.url] ?? []).map((e) => e.listId),
            }),
        )

        return lookups
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
