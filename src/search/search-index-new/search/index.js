import { groupLatestEventsByUrl, mapUrlsToLatestEvents } from './events'
import { mapResultsToDisplay } from './map-results-to-display'
import { findFilteredUrls, filterByBookmarks } from './filters'
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

/**
 * Should be run from inside a Dexie transaction.
 *
 * @param {SearchParams} params
 */
export default async function search(params) {
    console.time('SEARCH: main search')
    const results = await matchingPagesSearch(params)
    console.timeEnd('SEARCH: main search')

    console.time('SEARCH: result mapping')
    const docs = await mapResultsToDisplay(results.ids, params)
    console.timeEnd('SEARCH: result mapping')

    return { docs, totalCount: results.totalCount }
}

/**
 * @param {SearchParams} params
 */
async function matchingPagesSearch({ queryTerms = [], ...params }) {
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

    urlScoresMap = await filterByBookmarks(params, urlScoresMap)

    return {
        ids: paginate(urlScoresMap, params),
        totalCount: urlScoresMap.size,
    }
}
