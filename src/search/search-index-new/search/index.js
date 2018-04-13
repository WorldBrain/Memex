import db from '..'
import QueryBuilder from 'src/search/query-builder'
import { groupLatestEventsByUrl, mapUrlsToLatestEvents } from './events'
import { mapResultsToDisplay } from './map-results-to-display'
import { findFilteredUrls } from './filters'
import { textSearch } from './text-search'
import { paginate, applyScores } from './util'

export { domainHasFavIcon } from './fav-icon'

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
            console.time('TIMER - main search')
            const results = await fullSearch(params)
            console.timeEnd('TIMER - main search')

            console.time('TIMER - result mapping')
            const docs = await mapResultsFunc(results.ids, params)
            console.timeEnd('TIMER - result mapping')

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

export async function suggest(query = '', type, limit = 10) {
    // Start building the WhereClause from appropriate table
    const whereClause = (() => {
        switch (type) {
            case 'domain':
                return db.pages.where('domain')
            case 'tag':
            default:
                return db.tags.where('name')
        }
    })()

    // Perform suggestion matching
    return await whereClause
        .startsWith(query)
        .limit(limit)
        .uniqueKeys()
}

/**
 * Main search logic. Calls the rest of serach depending on input search params.
 *
 * @param {SearchParams} params
 */
async function fullSearch({ queryTerms = [], ...params }) {
    console.time('TIMER - findFilteredUrls()')
    const filteredUrls = await findFilteredUrls(params)
    console.timeEnd('TIMER - findFilteredUrls()')

    let totalCount = null
    let urlScoresMap

    // Few different cases of search params we can take short-cuts on
    if (!queryTerms.length && filteredUrls != null) {
        // Blank search + domain/tags filters: just grab the events for filtered URLs and paginate
        console.time('TIMER - mapUrlsToLatestEvents()')
        urlScoresMap = await mapUrlsToLatestEvents(params, filteredUrls)
        console.timeEnd('TIMER - mapUrlsToLatestEvents()')
        totalCount = urlScoresMap.size
        console.log(totalCount, urlScoresMap)
    } else if (!queryTerms.length) {
        // Blank search: simply do lookback from `endDate` on visits and score URLs by latest
        console.time('TIMER - groupLatestEventsByUrl()')
        urlScoresMap = await groupLatestEventsByUrl(params)
        console.timeEnd('TIMER - groupLatestEventsByUrl()')
    } else {
        // Terms search: do terms lookup first then latest event lookup (within time bounds) for each result
        console.time('TIMER - textSearch()')
        const urlScoreMultiMap = await textSearch({ queryTerms }, filteredUrls)
        console.timeEnd('TIMER - textSearch()')

        console.time('TIMER - mapUrlsToLatestEvents()')
        const urls = new Set(urlScoreMultiMap.keys())
        const latestEvents = await mapUrlsToLatestEvents(params, urls)
        console.timeEnd('TIMER - mapUrlsToLatestEvents()')

        console.time('TIMER - applyScores()')
        urlScoresMap = applyScores(urlScoreMultiMap, latestEvents)
        console.timeEnd('TIMER - applyScores()')
        totalCount = urlScoresMap.size
    }

    return { ids: paginate(urlScoresMap, params), totalCount }
}
