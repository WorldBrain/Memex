import db from '..'
import QueryBuilder from 'src/search/query-builder'
import { groupLatestEventsByUrl, mapUrlsToLatestEvents } from './events'
import { mapResultsToDisplay } from './map-results-to-display'
import { findFilteredUrls } from './filters'
import { textSearch } from './text-search'
import { paginate, applyScores } from './util'

export { domainHasFavIcon } from './fav-icon'
export { suggest } from './suggest'

/**
 * @typedef {Object} SearchParams
 * @property {string[]} [tags=[]]
 * @property {string[]} [domains=[]]
 * @property {string[]} [queryTerms=[]]
 * @property {number} [startDate=0] Lower-bound for visit time.
 * @property {number} [endDate=Date.now()] Upper-bound for visit time.
 * @property {number} [skip=0]
 * @property {number} [limit=10]
 */

/**
 * @typedef {Array} SearchResult
 * @property {string} 0 URL of found page.
 * @property {number} 1 Timestamp of latest event.
 */
export async function search({
    query,
    showOnlyBookmarks,
    mapResultsFunc = mapResultsToDisplay,
    domains = [],
    tags = [],
    ...restParams
}) {
    // Extract query terms via QueryBuilder (may change)
    const qb = new QueryBuilder()
        .searchTerm(query)
        .filterDomains(domains)
        .filterTags(tags)
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

    // Reshape needed params; prob consolidate interface later when remove old index code
    const params = {
        ...restParams,
        bookmarks: showOnlyBookmarks,
        queryTerms: [...qb.query],
        domains: [...qb.domain],
        tags: [...qb.tags],
    }

    const { docs, totalCount } = await db.transaction(
        'r',
        db.tables,
        async () => {
            const results = await fullSearch(params)
            const docs = await mapResultsFunc(results.ids, params)

            return { docs, totalCount: results.totalCount }
        },
    )

    return {
        docs,
        resultsExhausted: docs.length < params.limit,
        isBadTerm: qb.isBadTerm,
        totalCount,
    }
}

// WARNING: Inefficient; goes through entire table
export async function getMatchingPageCount(pattern) {
    const re = new RegExp(pattern, 'i')
    return await db.pages.filter(page => re.test(page.url)).count()
}

/**
 * Main search logic. Calls the rest of serach depending on input search params.
 *
 * @param {SearchParams} params
 */
async function fullSearch({ queryTerms = [], ...params }) {
    const filteredUrls = await findFilteredUrls(params)

    let totalCount = null
    let urlScoresMap

    // Few different cases of search params we can take short-cuts on
    if (!queryTerms.length && filteredUrls != null) {
        // Blank search + domain/tags filters: just grab the events for filtered URLs and paginate
        urlScoresMap = await mapUrlsToLatestEvents(params, filteredUrls)
        totalCount = urlScoresMap.size
    } else if (!queryTerms.length) {
        // Blank search: simply do lookback from `endDate` on visits and score URLs by latest
        urlScoresMap = await groupLatestEventsByUrl(params)
    } else {
        // Terms search: do terms lookup first then latest event lookup (within time bounds) for each result
        const urlScoreMultiMap = await textSearch({ queryTerms }, filteredUrls)

        const urls = new Set(urlScoreMultiMap.keys())
        const latestEvents = await mapUrlsToLatestEvents(params, urls)

        urlScoresMap = applyScores(urlScoreMultiMap, latestEvents)
        totalCount = urlScoresMap.size
    }

    return { ids: paginate(urlScoresMap, params), totalCount }
}
