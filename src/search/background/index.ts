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
    UnifiedSearchResult,
    UnifiedBlankSearchPageResultData,
    UnifiedBlankSearchParams,
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
import { sortUnifiedBlankSearchResult } from './utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

const dayMs = 1000 * 60 * 60 * 24

type UnifiedSearchLookupData = {
    pages: Map<string, Omit<AnnotPage, 'lists' | 'annotations' | 'hasBookmark'>>
    annotations: Map<string, Annotation>
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

    private async filterUnifiedSearchResultsByFilters(
        resultDataByPage: UnifiedBlankSearchResult['resultDataByPage'],
        { filterByDomains, filterByListIds }: UnifiedSearchParams,
    ) {
        if (
            !resultDataByPage.size ||
            (!filterByDomains.length && !filterByListIds.length)
        ) {
            return
        }

        // 1. OR'd filter by domains is easy - we already have all the data we need
        if (filterByDomains.length) {
            resultDataByPage.forEach((_, pageId) => {
                const isDomainIncluded = filterByDomains.reduce(
                    (acc, domain) => {
                        const domainRegexp = new RegExp(`^(\\w+\\.)?${domain}`)
                        return acc || domainRegexp.test(pageId)
                    },
                    false,
                )
                if (!isDomainIncluded) {
                    resultDataByPage.delete(pageId)
                }
            })
        }
        if (!resultDataByPage.size || !filterByListIds.length) {
            return
        }

        // 2. AND'd filter by lists is more tricky. First need to lookup annot privacy level data to know whether they inherit parent page lists or not
        const allAnnotIds: string[] = []
        const pageIdByAnnotId = new Map<string, string>()
        resultDataByPage.forEach(({ annotIds }, pageId) =>
            annotIds.forEach((annotId) => {
                allAnnotIds.push(annotId)
                pageIdByAnnotId.set(annotId, pageId)
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
            return filterByListIds.reduce(
                (acc, listId) => acc && listsWithEntries.includes(listId),
                true,
            )
        }

        // 3. Filter down selectively-shared annotations
        const annotListEntries: AnnotationListEntry[] = await this.options.storageManager
            .collection('annotListEntries')
            .findObjects({
                listId: { $in: filterByListIds },
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
                listId: { $in: filterByListIds },
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
            data.annotIds = data.annotIds.filter(
                (id) =>
                    selectivelySharedAnnotIds.includes(id) ||
                    autoSharedAnnotIds.includes(id),
            )
            if (
                !data.annotIds.length &&
                !hasEntriesForAllFilteredLists(pageListEntriesByPageId[pageId])
            ) {
                resultDataByPage.delete(pageId)
            }
        })
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
                annotIds: sortedAnnots.map((a) => a.url),
                timestamp: sortedAnnots[0].lastEdited.valueOf(),
            })
        }

        // Add in all the pages to the results
        for (const { url, time } of [...bookmarks, ...visits]) {
            const existing = resultDataByPage.get(url) ?? {
                timestamp: 0,
                annotIds: [],
            }
            // Only keep track of the visit/bookmark time if it's newer than anything seen so far
            if (time > existing.timestamp) {
                resultDataByPage.set(url, { ...existing, timestamp: time })
            }
        }

        await this.filterUnifiedSearchResultsByFilters(resultDataByPage, params)
        return {
            resultDataByPage,
            resultsExhausted: lowerBound <= params.lowestTimeBound,
            oldestResultTimestamp: lowerBound,
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
            throw new Error('TODO: Implement terms search')
        }

        const dataLookups = await this.lookupDataForUnifiedResults(result)
        const sortedResultPages = sortUnifiedBlankSearchResult(result)
        const mappedAnnotPages = sortedResultPages
            .map(([pageId, { annotIds }]) => {
                const page = dataLookups.pages.get(pageId)
                if (!page) {
                    throw new Error(
                        'Search error: Missing page data for search result',
                    )
                }
                return {
                    ...page,
                    lists: [], // TODO: lookup lists
                    hasBookmark: false, // TODO: lookup bookmark
                    annotations: [...annotIds]
                        .map((annotId) => dataLookups.annotations.get(annotId))
                        .filter(Boolean),
                }
            })
            .filter(Boolean)

        return {
            pages: mappedAnnotPages,
            resultsExhausted: result.resultsExhausted,
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
        const pageData: Page[] = await this.options.storageManager
            .collection('pages')
            .findObjects({
                url: { $in: pageIds },
            })

        const annotIds = [...resultDataByPage.values()].flatMap(
            ({ annotIds }) => annotIds,
        )
        const annotData: Annotation[] = await this.options.storageManager
            .collection('annotations')
            .findObjects({
                url: { $in: [...annotIds] },
            })

        pageData.map((p) => lookups.pages.set(p.url, p))
        annotData.map((a) => lookups.annotations.set(a.url, a))
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
