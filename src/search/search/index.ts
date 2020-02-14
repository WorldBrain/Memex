import { SearchParams, PageResultsMap, DBGet } from '..'
import QueryBuilder from '../query-builder'
import { initErrHandler } from '../storage'
import { groupLatestEventsByUrl, mapUrlsToLatestEvents } from './events'
import { mapResultsToDisplay } from './map-results-to-display'
import { findFilteredUrls } from './filters'
import { textSearch } from './text-search'
import { paginate, applyScores } from './util'
import { collections } from '../util'
import { DexieUtilsPlugin } from '../plugins/dexie-utils'

export const search = (getDb: DBGet) => async ({
    query,
    showOnlyBookmarks,
    mapResultsFunc = mapResultsToDisplay,
    domains = [],
    domainsExclude = [],
    tags = [],
    lists = [],
    ...restParams
}) => {
    const db = await getDb()
    // Extract query terms via QueryBuilder (may change)
    const { isBadTerm, isInvalidSearch, ...qbParams } = new QueryBuilder()
        .searchTerm(query)
        .filterDomains(domains)
        .filterExcDomains(domainsExclude)
        .filterTags(tags)
        .filterLists(lists)
        .get()

    // Short-circuit search if bad term
    if (isBadTerm) {
        return {
            docs: [],
            resultsExhausted: true,
            totalCount: null,
            isBadTerm: true,
        }
    }

    if (isInvalidSearch) {
        return {
            docs: [],
            resultsExhausted: true,
            totalCount: null,
            isInvalidSearch: true,
        }
    }

    const params = {
        ...restParams,
        bookmarks: showOnlyBookmarks,
        ...qbParams,
    } as SearchParams

    const { docs, totalCount } = await db
        .operation(
            'transaction',
            { collections: collections(db) },
            async () => {
                const results = await fullSearch(getDb)(params)

                const mappedDocs = await mapResultsFunc(getDb)(
                    results.ids,
                    params,
                )

                return { docs: mappedDocs, totalCount: results.totalCount }
            },
        )
        .catch(initErrHandler({ docs: [], totalCount: 0 }))

    return {
        docs,
        isBadTerm,
        totalCount,
        resultsExhausted: docs.length < params.limit,
    }
}

// WARNING: Inefficient; goes through entire table
export const getMatchingPageCount = (getDb: DBGet) => async pattern => {
    const db = await getDb()

    return db
        .operation(DexieUtilsPlugin.REGEXP_COUNT_OP, {
            collection: 'pages',
            fieldName: 'url',
            pattern,
        })
        .catch(initErrHandler(0))
}

/**
 * Main search logic. Calls the rest of search depending on input search params.
 */
export const fullSearch = (getDb: DBGet) => async ({
    terms = [],
    termsExclude = [],
    ...params
}: SearchParams) => {
    const filteredUrls = await findFilteredUrls(getDb)(params)

    let totalCount: number = null
    let urlScoresMap: PageResultsMap

    // Few different cases of search params we can take short-cuts on
    if (!terms.length && filteredUrls.isDataFiltered) {
        // Blank search + domain/tags filters: just grab the events for filtered URLs and paginate
        urlScoresMap = await mapUrlsToLatestEvents(getDb)(params, [
            ...filteredUrls.include,
        ])
        totalCount = urlScoresMap.size
    } else if (!terms.length) {
        // Blank search: simply do lookback from `endDate` on visits and score URLs by latest
        urlScoresMap = await groupLatestEventsByUrl(getDb)(params, filteredUrls)
    } else {
        // Terms search: do terms lookup first then latest event lookup (within time bounds) for each result
        const urlScoreMultiMap = await textSearch(getDb)(
            { terms, termsExclude },
            filteredUrls,
        )

        const urls = [...urlScoreMultiMap.keys()]
        const latestEvents = await mapUrlsToLatestEvents(getDb)(params, urls)

        const scoredResults = applyScores(urlScoreMultiMap, latestEvents)
        totalCount = scoredResults.length
        return { ids: paginate(scoredResults, params), totalCount }
    }

    return { ids: paginate(urlScoresMap, params), totalCount }
}
