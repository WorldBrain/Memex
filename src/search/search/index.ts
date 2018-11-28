import { SearchParams, PageResultsMap, Dexie } from '..'
import QueryBuilder from '../query-builder'
import { initErrHandler } from '../storage'
import { groupLatestEventsByUrl, mapUrlsToLatestEvents } from './events'
import { mapResultsToDisplay } from './map-results-to-display'
import { findFilteredUrls } from './filters'
import { textSearch } from './text-search'
import { paginate, applyScores } from './util'
export { domainHasFavIcon } from './fav-icon'
export { suggest, extendedSuggest } from './suggest'

export const search = (getDb: Promise<Dexie>) => async ({
    query,
    showOnlyBookmarks,
    mapResultsFunc = mapResultsToDisplay,
    domains = [],
    domainsExclude = [],
    tags = [],
    lists = [],
    ...restParams
}) => {
    const db = await getDb
    // Extract query terms via QueryBuilder (may change)
    const qb = new QueryBuilder()
        .searchTerm(query)
        .filterDomains(domains)
        .filterExcDomains(domainsExclude)
        .filterTags(tags)
        .filterLists(lists)
        .get()

    // Short-circuit search if bad term
    if (qb.isBadTerm) {
        return {
            docs: [],
            resultsExhausted: true,
            totalCount: null,
            isBadTerm: true,
        }
    }

    if (qb.isInvalidSearch) {
        return {
            docs: [],
            resultsExhausted: true,
            totalCount: null,
            isInvalidSearch: true,
        }
    }

    // WTF
    // Reshape needed params; prob consolidate interface later when remove old index code
    const params = {
        ...restParams,
        bookmarks: showOnlyBookmarks,
        terms: [...qb.query],
        termsExclude: [...qb.queryExclude],
        domains: [...qb.domain],
        domainsExclude: [...qb.domainExclude],
        tags: [...qb.tags],
        lists: [...qb.lists],
    } as SearchParams

    const { docs, totalCount } = await db
        .transaction('r', db.tables, async () => {
            const results = await fullSearch(getDb)(params)

            const mappedDocs = await mapResultsFunc(getDb)(results.ids, params)

            return { docs: mappedDocs, totalCount: results.totalCount }
        })
        .catch(initErrHandler({ docs: [], totalCount: 0 }))

    return {
        docs,
        resultsExhausted: docs.length < params.limit,
        isBadTerm: qb.isBadTerm,
        totalCount,
    }
}

// WARNING: Inefficient; goes through entire table
export const getMatchingPageCount = (
    getDb: Promise<Dexie>,
) => async pattern => {
    const db = await getDb
    const re = new RegExp(pattern, 'i')
    return db.pages
        .filter(page => re.test(page.url))
        .count()
        .catch(initErrHandler(0))
}

/**
 * Main search logic. Calls the rest of serach depending on input search params.
 */
const fullSearch = (getDb: Promise<Dexie>) => async ({
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

        urlScoresMap = applyScores(urlScoreMultiMap, latestEvents)
        totalCount = urlScoresMap.size
    }

    return { ids: paginate(urlScoresMap, params), totalCount }
}
