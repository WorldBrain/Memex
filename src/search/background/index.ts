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
    UnifiedBlankSearchResult,
    UnifiedBlankSearchParams,
    UnifiedTermsSearchParams,
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
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import {
    sortUnifiedBlankSearchResult,
    queryAnnotationsByTerms,
    queryPagesByTerms,
} from './utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { isUrlMemexSupportedVideo } from '@worldbrain/memex-common/lib/utils/youtube-url'
import { isUrlATweet } from '@worldbrain/memex-common/lib/twitter-integration/utils'
import { isUrlAnEventPage } from '@worldbrain/memex-common/lib/unified-search/utils'
import type Dexie from 'dexie'

const dayMs = 1000 * 60 * 60 * 24

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

        // Real lower/upper bound for blank search would be the time of the oldest/latest bookmark or visit
        const edgeTimestampDocs = (await Promise.all(
            ['visits', 'bookmarks'].map((coll) =>
                this.options.storageManager.collection(coll).findObject(
                    {},
                    {
                        order: [['time', edge === 'bottom' ? 'asc' : 'desc']],
                    },
                ),
            ),
        )) as [Visit?, Bookmark?]

        const timestamps = edgeTimestampDocs.filter(Boolean).map((t) => t.time)
        const edgeTimestamp =
            edge === 'bottom'
                ? Math.min(...timestamps)
                : Math.max(...timestamps)
        return edgeTimestamp !== Infinity ? edgeTimestamp : defaultTimestamp
    }

    private sliceUnifiedSearchResults(
        resultDataByPage: any[],
        { limit, skip }: UnifiedSearchPaginationParams,
    ): UnifiedBlankSearchResult['resultDataByPage'] {
        // NOTE: Current implementation ignores annotation count, and simply paginates by the number of pages in the results
        return new Map(resultDataByPage.slice(skip, skip + limit))
    }

    private async filterUnifiedSearchResultsByFilters(
        resultDataByPage: UnifiedBlankSearchResult['resultDataByPage'],
        params: UnifiedSearchParams,
    ): Promise<void> {
        const needToFilterByUrl =
            params.filterByDomains.length ||
            params.filterByPDFs ||
            params.filterByVideos ||
            params.filterByTweets ||
            params.filterByEvents ||
            params.omitPagesWithoutAnnotations

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

    private async unifiedBlankSearch(
        params: UnifiedBlankSearchParams,
    ): Promise<UnifiedBlankSearchResult> {
        const upperBound = params.untilWhen
        const lowerBound =
            params.fromWhen ?? upperBound - params.daysToSearch * dayMs
        const timeBoundsQuery = { $gt: lowerBound, $lt: upperBound }

        const resultDataByPage: UnifiedBlankSearchResult['resultDataByPage'] = new Map()
        const [annotations, visits, bookmarks] = await Promise.all([
            this.options.storageManager
                .collection('annotations')
                .findObjects<Annotation>({ lastEdited: timeBoundsQuery }),
            this.options.storageManager
                .collection('visits')
                .findObjects<Visit>({ time: timeBoundsQuery }),
            this.options.storageManager
                .collection('bookmarks')
                .findObjects<Bookmark>({ time: timeBoundsQuery }),
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
        const terms = [...new Set(params.query.split(/\s+/).filter(Boolean))]
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
        for (const { id, latestTimestamp } of pages) {
            const annotations = resultDataByPage.get(id)?.annotations ?? []
            resultDataByPage.set(id, {
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
            oldestResultTimestamp: null,
            resultDataByPage: paginatedResults,
            resultsExhausted: paginatedResults.size < params.limit,
        }
    }

    unifiedSearch: RemoteSearchInterface['unifiedSearch'] = async (params) => {
        let result: UnifiedBlankSearchResult
        // There's 2 separate search implementations depending on whether doing a terms search or not
        if (!params.query.trim().length) {
            const lowestTimeBound = await this.calcSearchTimeBoundEdge('bottom')
            const highestTimeBound = await this.calcSearchTimeBoundEdge('top')
            // Skip over days where there's no results, until we get results
            do {
                result = await this.unifiedBlankSearch({
                    ...params,
                    untilWhen:
                        result?.oldestResultTimestamp ?? // allows to paginate back from prev result
                        params.untilWhen ??
                        highestTimeBound, // default to latest timestamp in DB, to start off search
                    daysToSearch: 1,
                    lowestTimeBound,
                })
            } while (!result.resultsExhausted && !result.resultDataByPage.size)
        } else {
            console.time('Unified search')
            result = await this.unifiedTermsSearch({
                ...params,
                queryPages: queryPagesByTerms(this.options.storageManager, {
                    startsWithMatching: params.startsWithMatching,
                }),
                queryAnnotations: queryAnnotationsByTerms(
                    this.options.storageManager,
                ),
            })
            console.timeEnd('Unified search')
        }

        const dataLookups = await this.lookupDataForUnifiedResults(result)
        const sortedResultPages = sortUnifiedBlankSearchResult(
            result.resultDataByPage,
        )
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

    private async lookupDataForUnifiedResults({
        resultDataByPage,
    }: UnifiedBlankSearchResult): Promise<UnifiedSearchLookupData> {
        const pageIds = [...resultDataByPage.keys()]
        const annotIds = [
            ...resultDataByPage.values(),
        ].flatMap(({ annotations }) => annotations.map((a) => a.url))

        const [
            pages,
            annotations,
            pageListEntries,
            annotListEntries,
        ] = await Promise.all([
            // TODO: this Dexie query is here because the storex query didn't result in an indexed query happening
            //  Need to fix the bug in storex-backend-dexie when it comes time to port this
            (this.options.storageManager.backend['dexie'] as Dexie)
                .table<Page>('pages')
                .bulkGet(pageIds),
            this.options.storageManager
                .collection('annotations')
                .findObjects<Annotation>({
                    url: { $in: annotIds },
                }),
            this.options.storageManager
                .collection('pageListEntries')
                .findObjects<PageListEntry>({
                    listId: { $ne: SPECIAL_LIST_IDS.INBOX },
                    pageUrl: { $in: pageIds },
                }),
            this.options.storageManager
                .collection('annotListEntries')
                .findObjects<AnnotationListEntry>({
                    listId: { $ne: SPECIAL_LIST_IDS.INBOX },
                    url: { $in: annotIds },
                }),
        ])

        const listIdsByPage = groupBy(pageListEntries, (e) => e.pageUrl)
        const listIdsByAnnot = groupBy(annotListEntries, (e) => e.url)

        const lookups: UnifiedSearchLookupData = {
            annotations: new Map(),
            pages: new Map(),
        }
        for (const page of pages) {
            lookups.pages.set(page.url, {
                ...page,
                lists: (listIdsByPage[page.url] ?? []).map((e) => e.listId),
                displayTime:
                    resultDataByPage.get(page.url)?.latestPageTimestamp ?? 0,
            })
        }
        for (const annotation of annotations) {
            lookups.annotations.set(annotation.url, {
                ...annotation,
                lists: (listIdsByAnnot[annotation.url] ?? []).map(
                    (e) => e.listId,
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
