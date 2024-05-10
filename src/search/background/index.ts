import type Storex from '@worldbrain/storex'
import groupBy from 'lodash/groupBy'
import fromPairs from 'lodash/fromPairs'
import partition from 'lodash/partition'
import SearchStorage from './storage'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import type {
    RemoteSearchInterface,
    AnnotPage,
    UnifiedSearchParams,
    UnifiedBlankSearchParams,
    UnifiedTermsSearchParams,
    ResultDataByPage,
    IntermediarySearchResult,
    UnifiedSearchPaginationParams,
} from './types'
import { SearchError, BadTermError } from './errors'
import type { PageIndexingBackground } from 'src/page-indexing/background'
import {
    isMemexPageAPdf,
    pickBestLocator,
} from '@worldbrain/memex-common/lib/page-indexing/utils'
import {
    ContentLocatorType,
    LocationSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
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
    FavIcon,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import {
    sortSearchResult,
    queryAnnotationsByTerms,
    queryPagesByTerms,
    splitQueryIntoTerms,
    sliceSearchResult,
    needToFilterSearchByUrl,
} from './utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import {
    VIDEO_PROVIDER_URLS,
    YOUTUBE_URLS,
    isUrlMemexSupportedVideo,
} from '@worldbrain/memex-common/lib/utils/youtube-url'
import { isUrlATweet } from '@worldbrain/memex-common/lib/twitter-integration/utils'
import { isUrlAnEventPage } from '@worldbrain/memex-common/lib/unified-search/utils'
import type Dexie from 'dexie'
import { blobToDataURL } from 'src/util/blob-utils'
import { intersectSets } from 'src/util/map-set-helpers'
import { PDF_PAGE_URL_PREFIX } from '@worldbrain/memex-common/lib/page-indexing/constants'
import { EVENT_PROVIDER_URLS } from '@worldbrain/memex-common/lib/constants'
import { TWITTER_URLS } from '@worldbrain/memex-common/lib/twitter-integration/constants'

type UnifiedSearchLookupData = {
    pages: Map<string, Omit<AnnotPage, 'annotations' | 'hasBookmark'>>
    annotations: Map<string, Annotation & { lists: number[] }>
}

export default class SearchBackground {
    storage: SearchStorage
    public remoteFunctions: RemoteSearchInterface

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
            pages: PageIndexingBackground
            analyticsBG: AnalyticsCoreInterface
        },
    ) {
        this.storage = new SearchStorage({
            storageManager: options.storageManager,
        })

        this.remoteFunctions = {
            suggest: this.storage.suggest,
            unifiedSearch: this.unifiedSearch,
            extendedSuggest: this.storage.suggestExtended,
            delPages: this.options.pages.delPages.bind(this.options.pages),
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    private async calcSearchTimeBoundEdge(
        edge: 'top' | 'bottom',
    ): Promise<number> {
        const defaultTimestamp = edge === 'bottom' ? Date.now() : 0

        const dexie = this.options.storageManager.backend['dexie'] as Dexie
        const orderedVisits = dexie.table<Visit>('visits').orderBy('time')
        const orderedBookmarks = dexie
            .table<Bookmark>('bookmarks')
            .orderBy('time')
        const orderedAnnotations = dexie
            .table<Annotation>('annotations')
            .orderBy('lastEdited')

        // Real lower/upper bound for blank search would be the time of the oldest/latest bookmark or visit
        const edgeTimestampDocs = await Promise.all(
            edge === 'bottom'
                ? [
                      orderedVisits.first(),
                      orderedBookmarks.first(),
                      orderedAnnotations.first(),
                  ]
                : [
                      orderedVisits.last(),
                      orderedBookmarks.last(),
                      orderedAnnotations.last(),
                  ],
        )

        const timestamps = edgeTimestampDocs
            .filter(Boolean)
            .map((doc) => ('time' in doc ? doc.time : doc.lastEdited.valueOf()))
        const edgeTimestamp =
            edge === 'bottom'
                ? Math.min(...timestamps)
                : Math.max(...timestamps)
        return Math.abs(edgeTimestamp) !== Infinity
            ? edgeTimestamp
            : defaultTimestamp
    }

    private async calcBlankSearchTimeBoundEdges(
        params: UnifiedSearchParams,
    ): Promise<[number, number]> {
        let latestTimes: number[] = []
        let oldestTimes: number[] = []

        if (
            !needToFilterSearchByUrl(params) &&
            !params.filterByListIds.length
        ) {
            return [
                await this.calcSearchTimeBoundEdge('bottom'),
                await this.calcSearchTimeBoundEdge('top'),
            ]
        }

        const dexie = this.options.storageManager.backend['dexie'] as Dexie

        if (params.filterByListIds) {
            let [pageListEntries, annotListEntries] = await Promise.all([
                dexie
                    .table<PageListEntry>('pageListEntries')
                    .where('listId')
                    .anyOf(params.filterByListIds)
                    .toArray(),
                dexie
                    .table<AnnotationListEntry>('annotListEntries')
                    .where('listId')
                    .anyOf(params.filterByListIds)
                    .toArray(),
            ])

            // Get intersection of entries on lists (enforces "AND" nature of search)
            let pageIdsToKeep = new Set<string>()
            let annotIdsToKeep = new Set<string>()
            let pageListEntriesByPage = groupBy(
                pageListEntries,
                (e) => e.pageUrl,
            )
            let annotListEntriesByAnnot = groupBy(
                annotListEntries,
                (e) => e.url,
            )
            for (const [pageId, entries] of Object.entries(
                pageListEntriesByPage,
            )) {
                if (entries.length === params.filterByListIds.length) {
                    pageIdsToKeep.add(pageId)
                }
            }
            for (const [annotId, entries] of Object.entries(
                annotListEntriesByAnnot,
            )) {
                if (entries.length === params.filterByListIds.length) {
                    annotIdsToKeep.add(annotId)
                }
            }

            pageListEntries = pageListEntries.filter((e) =>
                pageIdsToKeep.has(e.pageUrl),
            )
            annotListEntries = annotListEntries.filter((e) =>
                annotIdsToKeep.has(e.url),
            )

            // Now keep track of oldest/latest entries
            const ascendingTimes = pageListEntries
                .map((e) => e.createdAt.valueOf())
                .concat(annotListEntries.map((e) => e.createdAt.valueOf()))
                .sort((a, b) => a - b)
            if (ascendingTimes.length === 1) {
                latestTimes.push(ascendingTimes[0])
            } else if (ascendingTimes.length > 1) {
                oldestTimes.push(ascendingTimes[0])
                latestTimes.push(ascendingTimes[ascendingTimes.length - 1])
            }
        }

        if (params.omitPagesWithoutAnnotations) {
            const annots = dexie.table<Annotation>('annotations')
            const latestAnnot = await annots.orderBy('lastEdited').last()
            const oldestAnnot = await annots.orderBy('lastEdited').first()
            if (latestAnnot) {
                latestTimes.push(latestAnnot.lastEdited.valueOf())
            }
            if (oldestAnnot) {
                oldestTimes.push(oldestAnnot.lastEdited.valueOf())
            }
        }

        // Lots of the filters are essentially just domains filters, so collect the relevant domains and do it all in one go
        let domainsToQuery = []
        if (params.filterByDomains.length) {
            domainsToQuery.push(...params.filterByDomains)
        }
        if (params.filterByPDFs) {
            domainsToQuery.push(PDF_PAGE_URL_PREFIX)
        }
        if (params.filterByEvents) {
            domainsToQuery.push(...EVENT_PROVIDER_URLS)
        }
        if (params.filterByVideos) {
            domainsToQuery.push(...VIDEO_PROVIDER_URLS.concat(YOUTUBE_URLS))
        }
        if (params.filterByTweets) {
            domainsToQuery.push(...TWITTER_URLS)
        }
        if (domainsToQuery.length) {
            const getDocsMatchingDomains = <T>(table: Dexie.Table<T>) =>
                table.where('url').startsWithAnyOf(domainsToQuery).toArray()

            const [visits, bookmarks, annotations] = await Promise.all([
                getDocsMatchingDomains(dexie.table<Visit>('visits')),
                getDocsMatchingDomains(dexie.table<Bookmark>('bookmarks')),
                getDocsMatchingDomains(dexie.table<Annotation>('annotations')),
            ])
            const ascendingTimes = visits
                .map((v) => v.time)
                .concat(bookmarks.map((b) => b.time))
                .concat(annotations.map((a) => a.lastEdited.valueOf()))
                .sort((a, b) => a - b)

            if (ascendingTimes.length === 1) {
                latestTimes.push(ascendingTimes[0])
            } else if (ascendingTimes.length > 1) {
                oldestTimes.push(ascendingTimes[0])
                latestTimes.push(ascendingTimes[ascendingTimes.length - 1])
            }
        }

        let maxOfOldestTimes = Math.max(...oldestTimes)
        let minOfLatestTimes = Math.min(...latestTimes)
        // Handle edge cases where time arrays may be empty by using default extremes
        maxOfOldestTimes =
            Math.abs(maxOfOldestTimes) === Infinity ? 0 : maxOfOldestTimes
        minOfLatestTimes =
            Math.abs(minOfLatestTimes) === Infinity
                ? Date.now()
                : minOfLatestTimes
        return [maxOfOldestTimes, minOfLatestTimes]
    }

    private async filterUnifiedSearchResultsByFilters(
        resultDataByPage: ResultDataByPage,
        params: UnifiedSearchParams,
    ): Promise<void> {
        const needToFilterByUrl = needToFilterSearchByUrl(params)
        if (
            !needToFilterByUrl &&
            !resultDataByPage.size &&
            !params.filterByListIds.length
        ) {
            return
        }
        const pageIdsToFilterOut = new Set<string>()

        // Perform any specified URL filters. These are all relatively simple URL tests
        if (needToFilterByUrl) {
            resultDataByPage.forEach(({ annotations }, pageId) => {
                // prettier-ignore
                const shouldFilterOutPage =
                    (params.omitPagesWithoutAnnotations && !annotations.length) ||
                    (params.filterByEvents && !isUrlAnEventPage(pageId)) ||
                    (params.filterByTweets && !isUrlATweet(pageId)) ||
                    (params.filterByVideos && !isUrlMemexSupportedVideo(pageId)) ||
                    (params.filterByPDFs && !isMemexPageAPdf({ url: pageId })) ||
                    // Does an OR filter on supplied domains
                    (params.filterByDomains.length &&
                        !params.filterByDomains.reduce((acc, domain) => {
                            const domainRegexp = new RegExp(
                                `^(\\w+\\.)?${domain}`, // This allows for subdomains
                            )
                            return acc || domainRegexp.test(pageId)
                        }, false))

                if (shouldFilterOutPage) {
                    pageIdsToFilterOut.add(pageId)
                }
            })
        }
        pageIdsToFilterOut.forEach((id) => resultDataByPage.delete(id))

        if (!resultDataByPage.size || !params.filterByListIds.length) {
            return
        }

        // AND'd filter by lists is more tricky...
        const allAnnotIds: string[] = []
        const pageIdByAnnotId = new Map<string, string>()
        resultDataByPage.forEach(({ annotations }, pageId) =>
            annotations.forEach((annot) => {
                allAnnotIds.push(annot.url)
                pageIdByAnnotId.set(annot.url, pageId)
            }),
        )

        // 1. Need to lookup annot privacy level data to know whether they inherit parent page lists or not
        const privacyLevels = await this.options.storageManager
            .collection('annotationPrivacyLevels')
            .findObjects<AnnotationPrivacyLevel>({
                annotation: { $in: allAnnotIds },
            })
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

        // 2. Filter down selectively-shared annotations
        const annotListEntries = await this.options.storageManager
            .collection('annotListEntries')
            .findObjects<AnnotationListEntry>({
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

        // 3. Filter down auto-shared annotations
        const pageListEntries = await this.options.storageManager
            .collection('pageListEntries')
            .findObjects<PageListEntry>({
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

        // 4. Apply annotation filtering to the results, and filter out any pages not in lists without remaining annotations
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
                pageIdsToFilterOut.add(pageId)
            }
        })
        pageIdsToFilterOut.forEach((id) => resultDataByPage.delete(id))
    }

    private async unifiedBlankListsSearch(
        params: UnifiedSearchParams,
    ): Promise<IntermediarySearchResult> {
        if (!params.filterByListIds.length) {
            throw new Error(
                'Lists search was called but no lists were filtered',
            )
        }
        const resultDataByPage: ResultDataByPage = new Map()

        const dexie = this.options.storageManager.backend['dexie'] as Dexie
        const [pageListEntries, annotListEntries] = await Promise.all([
            dexie
                .table<PageListEntry>('pageListEntries')
                .where('listId')
                .anyOf(params.filterByListIds)
                .toArray(),
            dexie
                .table<AnnotationListEntry>('annotListEntries')
                .where('listId')
                .anyOf(params.filterByListIds)
                .toArray(),
        ])

        const latestListEntryTimeByPage = fromPairs(
            pageListEntries
                .sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())
                .map((e) => [e.pageUrl, e.createdAt.valueOf() as number]),
        )

        // Get intersections of page + annot IDs for all lists - effectively "AND"s the lists
        const validPageIds = params.filterByListIds
            .map(
                (listId) =>
                    new Set(
                        pageListEntries
                            .filter((e) => e.listId === listId)
                            .map((e) => e.pageUrl),
                    ),
            )
            .reduce((a, b) => intersectSets(a)(b))
        const validAnnotIds = params.filterByListIds
            .map(
                (listId) =>
                    new Set(
                        annotListEntries
                            .filter((e) => e.listId === listId)
                            .map((e) => e.url),
                    ),
            )
            .reduce((a, b) => intersectSets(a)(b))

        // Get auto-shared annotations
        let autoSharedAnnots = await dexie
            .table<Annotation>('annotations')
            .where('pageUrl')
            .anyOf([...validPageIds])
            .toArray()
        let annotPrivacyLevels = await dexie
            .table<AnnotationPrivacyLevel>('annotationPrivacyLevels')
            .where('annotation')
            .anyOf(autoSharedAnnots.map((a) => a.url))
            .toArray()
        let autoSharedAnnotIds = new Set(
            annotPrivacyLevels
                .filter((l) =>
                    [
                        AnnotationPrivacyLevels.SHARED,
                        AnnotationPrivacyLevels.SHARED_PROTECTED,
                    ].includes(l.privacyLevel),
                )
                .map((l) => l.annotation),
        )
        autoSharedAnnots = autoSharedAnnots.filter((a) =>
            autoSharedAnnotIds.has(a.url),
        )

        // Get selectively-shared annotations
        const selectivelySharedAnnots = await dexie
            .table<Annotation>('annotations')
            .bulkGet([...validAnnotIds])

        // Add in all the annotations to the results
        const annotsByPage = groupBy(
            [...autoSharedAnnots, ...selectivelySharedAnnots],
            (a) => a.pageUrl,
        )
        for (const [pageId, annots] of Object.entries(annotsByPage)) {
            const descOrderedAnnots = annots.sort(
                (a, b) => b.lastEdited.valueOf() - a.lastEdited.valueOf(),
            )
            resultDataByPage.set(pageId, {
                annotations: descOrderedAnnots,
                // These may get overwritten in the next loop by the latest page list entry time
                latestPageTimestamp: descOrderedAnnots[0].lastEdited.valueOf(),
                oldestTimestamp: 0,
            })
        }

        for (const pageId of validPageIds) {
            const latestPageTimestamp = latestListEntryTimeByPage[pageId] ?? 0
            const existing = resultDataByPage.get(pageId) ?? {
                annotations: [],
                latestPageTimestamp,
                oldestTimestamp: 0,
            }
            resultDataByPage.set(pageId, {
                ...existing,
                latestPageTimestamp,
            })
        }

        return {
            resultDataByPage,
            oldestResultTimestamp: 0,
            resultsExhausted: true,
        }
    }

    private async unifiedBlankSearch(
        params: UnifiedBlankSearchParams,
    ): Promise<IntermediarySearchResult> {
        const resultDataByPage: ResultDataByPage = new Map()
        // TODO: these Dexie queries are here because the storex query didn't result in an indexed query happening
        //  Need to fix the bug in storex-backend-dexie when it comes time to port this and revert them to storex queries
        const dexie = this.options.storageManager.backend['dexie'] as Dexie
        let [annotations, visits, bookmarks] = await Promise.all([
            dexie
                .table<Annotation>('annotations')
                .where('lastEdited')
                .below(new Date(params.untilWhen))
                .reverse()
                .limit(params.limit)
                .toArray(),
            dexie
                .table<Visit>('visits')
                .where('[time+url]')
                .below([params.untilWhen])
                .reverse()
                .limit(params.limit)
                .toArray(),
            dexie
                .table<Bookmark>('bookmarks')
                .where('time')
                .below(params.untilWhen)
                .reverse()
                .limit(params.limit)
                .toArray(),
        ])

        // Work with only the latest N results for this results page, discarding rest
        const inScopeResults = [...annotations, ...visits, ...bookmarks]
            // TODO: pick one of the latest visit of bookmark, else each bookmark's also going to show up in results via the visit
            .sort((a, b) => {
                const timeA =
                    'lastEdited' in a ? a.lastEdited.valueOf() : a.time
                const timeB =
                    'lastEdited' in b ? b.lastEdited.valueOf() : b.time
                return timeB - timeA
            })
            .slice(0, params.limit)
        const onlyInScope = (doc: any) => inScopeResults.includes(doc)
        annotations = annotations.filter(onlyInScope)
        bookmarks = bookmarks.filter(onlyInScope)
        visits = visits.filter(onlyInScope)

        // Add in all the annotations to the results
        const annotsByPage = groupBy(annotations, (a) => a.pageUrl)
        for (const [pageId, annots] of Object.entries(annotsByPage)) {
            const descOrderedAnnots = annots.sort(
                (a, b) => b.lastEdited.valueOf() - a.lastEdited.valueOf(),
            )
            resultDataByPage.set(pageId, {
                annotations: descOrderedAnnots,
                // These get overwritten in the next loop by the latest/oldest visit/bookmark time (if exist in this results "page")
                latestPageTimestamp: descOrderedAnnots[0].lastEdited.valueOf(),
                oldestTimestamp: descOrderedAnnots[
                    descOrderedAnnots.length - 1
                ].lastEdited.valueOf(),
            })
        }

        // Add in all the pages to the results
        const ascOrdered = [...bookmarks, ...visits].sort(
            (a, b) => a.time - b.time,
        )
        for (const { url, time } of ascOrdered) {
            const annotations = resultDataByPage.get(url)?.annotations ?? []
            resultDataByPage.set(url, {
                annotations,
                latestPageTimestamp: time, // Should end up being the latest one, given ordering
                oldestTimestamp: ascOrdered[0].time, // First visit/bm should always be older than annot
            })
        }

        await this.filterUnifiedSearchResultsByFilters(resultDataByPage, params)
        let lowerBound: number
        if (!inScopeResults.length) {
            lowerBound = 0
        } else {
            const oldestResult = inScopeResults[inScopeResults.length - 1]
            lowerBound =
                'lastEdited' in oldestResult
                    ? oldestResult.lastEdited.valueOf()
                    : oldestResult.time
        }

        return {
            resultDataByPage,
            resultsExhausted: lowerBound <= params.lowestTimeBound,
            oldestResultTimestamp: lowerBound,
        }
    }

    private async unifiedTermsSearch(
        params: UnifiedTermsSearchParams,
    ): Promise<IntermediarySearchResult> {
        const resultDataByPage: ResultDataByPage = new Map()

        const [pages, annotations] = await Promise.all([
            params.queryPages(params.terms, params.phrases),
            params.queryAnnotations(params.terms, params.phrases),
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
                oldestTimestamp: 0,
            })
        }

        // Add in all the pages to the results
        for (const { id, latestTimestamp } of pages) {
            const annotations = resultDataByPage.get(id)?.annotations ?? []
            resultDataByPage.set(id, {
                annotations,
                latestPageTimestamp: latestTimestamp,
                oldestTimestamp: 0,
            })
        }

        await this.filterUnifiedSearchResultsByFilters(resultDataByPage, params)

        // Paginate!
        const sortedResultPages = sortSearchResult(resultDataByPage)
        const paginatedResults = sliceSearchResult(sortedResultPages, params)

        return {
            oldestResultTimestamp: null,
            resultDataByPage: paginatedResults,
            resultsExhausted: paginatedResults.size < params.limit,
        }
    }

    private async unifiedIntermediarySearch(
        params: UnifiedSearchParams & UnifiedSearchPaginationParams,
    ): Promise<IntermediarySearchResult> {
        const isTermsSearch = params.query.trim().length

        // There's 3 separate search implementations depending on whether doing a terms search or not and if we're filtering by list
        if (!isTermsSearch) {
            if (params.filterByListIds.length) {
                return this.unifiedBlankListsSearch(params)
            } else {
                let result: IntermediarySearchResult
                let [
                    lowestTimeBound,
                    highestTimeBound,
                ] = await this.calcBlankSearchTimeBoundEdges(params)
                highestTimeBound += 1

                // Skip over days where there's no results, until we get results
                do {
                    result = await this.unifiedBlankSearch({
                        ...params,
                        lowestTimeBound,
                        untilWhen:
                            result?.oldestResultTimestamp ??
                            params.untilWhen ?? // affords pagination back from prev result
                            highestTimeBound,
                    })
                } while (
                    !result.resultsExhausted &&
                    !result.resultDataByPage.size
                )
                return result
            }
        }

        const {
            phrases,
            terms,
            inTitle,
            inContent,
            inHighlight,
            inComment,
            matchTermsFuzzyStartsWith,
        } = splitQueryIntoTerms(params.query)

        params.matchPageTitleUrl = inTitle
        params.matchPageText = inContent
        params.matchNotes = inComment
        params.matchHighlights = inHighlight
        params.phrases = phrases
        params.terms = terms
        params.matchTermsFuzzyStartsWith = matchTermsFuzzyStartsWith
        return this.unifiedTermsSearch({
            ...params,
            queryPages: queryPagesByTerms(this.options.storageManager, params),
            queryAnnotations: queryAnnotationsByTerms(
                this.options.storageManager,
                params,
            ),
        })
    }

    unifiedSearch: RemoteSearchInterface['unifiedSearch'] = async (params) => {
        const result = await this.unifiedIntermediarySearch(params)
        const dataLookups = await this.lookupDataForUnifiedResults(
            result.resultDataByPage,
        )
        const sortedResultPages = sortSearchResult(result.resultDataByPage)
        const dataEnrichedAnnotPages = sortedResultPages
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
            docs: dataEnrichedAnnotPages,
            resultsExhausted: result.resultsExhausted,
            oldestResultTimestamp: result.oldestResultTimestamp,
        }
    }

    private async lookupDataForUnifiedResults(
        resultDataByPage: ResultDataByPage,
    ): Promise<UnifiedSearchLookupData> {
        const pageIds = [...resultDataByPage.keys()]
        const annotIds = [
            ...resultDataByPage.values(),
        ].flatMap(({ annotations }) => annotations.map((a) => a.url))

        const dexie = this.options.storageManager.backend['dexie'] as Dexie
        const [
            pages,
            annotations,
            pageListEntries,
            annotListEntries,
        ] = await Promise.all([
            // TODO: these Dexie queries are here because the storex query didn't result in an indexed query happening
            //  Need to fix the bug in storex-backend-dexie when it comes time to port this and revert them to storex queries
            dexie.table<Page>('pages').bulkGet(pageIds),
            dexie.table<Annotation>('annotations').bulkGet(annotIds),
            dexie
                .table<PageListEntry, [number, string]>('pageListEntries')
                .where('pageUrl')
                .anyOf(pageIds)
                .filter((e) => e.listId !== SPECIAL_LIST_IDS.INBOX)
                .primaryKeys(),
            dexie
                .table<AnnotationListEntry, [number, string]>(
                    'annotListEntries',
                )
                .where('url')
                .anyOf(annotIds)
                .filter((e) => e.listId !== SPECIAL_LIST_IDS.INBOX)
                .primaryKeys(),
            // this.options.storageManager
            //     .collection('pages')
            //     .findObjects<Page>({ url: { $in: pageIds } }),
            // this.options.storageManager
            //     .collection('annotations')
            //     .findObjects<Annotation>({
            //         url: { $in: annotIds },
            //     }),
            // this.options.storageManager
            //     .collection('pageListEntries')
            //     .findObjects<PageListEntry>({
            //         listId: { $ne: SPECIAL_LIST_IDS.INBOX },
            //         pageUrl: { $in: pageIds },
            //     }),
            // this.options.storageManager
            //     .collection('annotListEntries')
            //     .findObjects<AnnotationListEntry>({
            //         listId: { $ne: SPECIAL_LIST_IDS.INBOX },
            //         url: { $in: annotIds },
            //     }),
        ])

        const annotCountsByPage = fromPairs<number>(
            await Promise.all(
                pages.map(
                    async (page) =>
                        [
                            page.url,
                            await dexie
                                .table('annotations')
                                .where('pageUrl')
                                .equals(page.url)
                                .count(),
                        ] as [string, number],
                ),
            ),
        )

        const hostnames = [...new Set(pages.map((p) => p.hostname))]
        const favIcons = await dexie
            .table<FavIcon>('favIcons')
            .bulkGet(hostnames)

        const favIconDataURLs = await Promise.all(
            favIcons.filter(Boolean).map(async (f) => ({
                hostname: f.hostname,
                favIconDataURL: await blobToDataURL(f.favIcon),
            })),
        )
        const favIconByHostname = fromPairs(
            favIconDataURLs.map((f) => [f.hostname, f.favIconDataURL]),
        )
        const listIdsByPage = groupBy(pageListEntries, ([, pageUrl]) => pageUrl)
        const listIdsByAnnot = groupBy(
            annotListEntries,
            ([, pageUrl]) => pageUrl,
        )

        const lookups: UnifiedSearchLookupData = {
            annotations: new Map(),
            pages: new Map(),
        }
        for (const page of pages) {
            lookups.pages.set(page.url, {
                ...page,
                lists: (listIdsByPage[page.url] ?? []).map(
                    ([listId]) => listId,
                ),
                displayTime:
                    resultDataByPage.get(page.url)?.latestPageTimestamp ?? 0,
                favIcon: favIconByHostname[page.hostname],
                totalAnnotationsCount: annotCountsByPage[page.url] ?? 0,
            })
        }
        for (const annotation of annotations) {
            lookups.annotations.set(annotation.url, {
                ...annotation,
                lists: (listIdsByAnnot[annotation.url] ?? []).map(
                    ([listId]) => listId,
                ),
            })
        }

        return lookups
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
}
