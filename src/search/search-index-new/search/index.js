import db from '..'
import QueryBuilder from 'src/search/query-builder'
import { groupLatestEventsByUrl, mapUrlsToLatestEvents } from './events'
import { mapResultsToDisplay } from './map-results-to-display'
import { findFilteredUrls } from './filters'
import { textSearch } from './text-search'
import { paginate, applyScores } from './util'

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
            totalCount: 0,
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
    const filteredUrls = await findFilteredUrls(params)

    let urlScoresMap

    // Blank search; simply do lookback from `endDate` on visits and score URLs by latest
    if (!queryTerms.length) {
        urlScoresMap = await groupLatestEventsByUrl(params, filteredUrls)
    } else {
        // Do terms lookup first then latest event lookup (within time bounds) for each result
        const urlScoreMultiMap = await textSearch({ queryTerms }, filteredUrls)
        const urls = new Set(urlScoreMultiMap.keys())
        const latestEvents = await mapUrlsToLatestEvents(params, urls)

        urlScoresMap = applyScores(urlScoreMultiMap, latestEvents)
    }

    return {
        ids: paginate(urlScoresMap, params),
        totalCount: urlScoresMap.size,
    }
}
