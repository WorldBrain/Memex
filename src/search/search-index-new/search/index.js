import { groupLatestVisitsByUrl, mapUrlsToVisits } from './visits'
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
        urlScoresMap = await groupLatestVisitsByUrl(params, filteredUrls, true)
    } else {
        // Do terms lookup first then visit lookup for each result
        const urlScoreMap = await textSearch({ queryTerms }, filteredUrls)
        const latestVisits = await mapUrlsToVisits(params, urlScoreMap.keys())

        urlScoresMap = applyScores(urlScoreMap, latestVisits)
    }

    urlScoresMap = await filterByBookmarks(params, urlScoresMap)

    return {
        ids: paginate(urlScoresMap, params),
        totalCount: urlScoresMap.size,
    }
}
