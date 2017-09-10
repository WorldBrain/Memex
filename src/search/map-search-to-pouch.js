import reduce from 'lodash/fp/reduce'

import db, { bulkGetResultsToArray } from 'src/pouchdb'
import { RESULT_TYPES } from 'src/overview/constants'

/**
 * Given an augmented page doc determine its "type" for use to display in the views.
 * Either `visit` or `bookmark` will be chosen determined by whichever is latest (if available).
 * @param {any} augmentedPageDoc The augmented page doc from search results.
 * @returns {string} Display type string matching one of `constants.RESULT_TYPES`.
 *  Unknown type given in case of bad data (no assoc. meta timestamp)
 */
function checkPageDocType({ bookmark, visit }) {
    let type = RESULT_TYPES.UNKNOWN

    // If both exist, find the time of the latest oneO
    if (visit && bookmark) {
        type = visit > bookmark
            ? RESULT_TYPES.VISIT
            : RESULT_TYPES.BOOKMARK
    } else if (visit) {
        type = RESULT_TYPES.VISIT
    } else if (bookmark) {
        type = RESULT_TYPES.BOOKMARK
    }

    return type
}

/**
* NOTE: Assumes order for O(1) "lookup" of latest time
* @param {Array<string>} timestamps ORDERED array of timestamp strings to get latest (last) one.
* @returns {string} The latest timestamp
*/
const getLatestTime = (timestamps = []) => timestamps[timestamps.length - 1]

/**
* Creates a quick-lookup dictionary of page doc IDs to the associated meta doc IDs
* from our search-index results. The index result score is also kept for later sorting.
* @param {Array<any>} results Array of search-idnex results.
* @returns {any} Object with page ID keys and values containing either bookmark or visit or both docs.
*/
const createResultIdsDict = reduce((acc, result) => ({
    ...acc,
    [result.document.id]: {
        pageId: result.document.id,
        visit: getLatestTime(result.document.visits),
        bookmark: getLatestTime(result.document.bookmarks),
        score: result.score,
    },
}), {})

// Sort predicates based on time and search relevance
const sortByTime = () => (docA, docB) =>
    docB[docB.displayType] - docA[docA.displayType]

const sortByRelevance = resultIdsDict => (docA, docB) =>
    resultIdsDict[docA._id].score - resultIdsDict[docB._id].score

/**
* Performs all the messy logic needed to resolve search-index results against our PouchDB model.
* Given n results, should produce n page docs with the latest associated meta docs timestamps
* available under either `bookmark` or `visit` key, or both. For the sake of differentiation,
* call these "augmented page docs", and are generally only used by the overview.
*
* @param {Array<any>} results Array of results gotten from our search-index query.
* @param {boolean} [shouldSortByTime=false] Whether or not to order results by time.
* @returns {Array<any>} Array of augmented page docs containing linked meta doc timestamps.
*/
export default async function mapResultsToPouchDocs(results, shouldSortByTime = false) {
    // Convert results to dictionary of page IDs to related meta IDs
    const resultIdsDict = createResultIdsDict(results)

    // Format IDs of docs needed to be immediately fetched from Pouch
    const bulkGetInput = results.map(result => ({ id: result.document.id }))

    // Perform bulk fetch for needed docs from pouch
    const bulkRes = await db.bulkGet({ docs: bulkGetInput })
    const pageDocs = bulkGetResultsToArray(bulkRes)

    // Augment the page docs with latest meta timestamp/s and type denoting the latest time for display
    const augmentedPageDocs = pageDocs.map(doc => ({
        ...doc,
        visit: +resultIdsDict[doc._id].visit,
        bookmark: +resultIdsDict[doc._id].bookmark,
        displayType: checkPageDocType(resultIdsDict[doc._id]),
    }))

    // Perform time-based sort if default query (based on greatest meta doc time)
    const sortPredicate = shouldSortByTime ? sortByTime() : sortByRelevance(resultIdsDict)

    // Ensure the original results order is maintained, if specified
    return augmentedPageDocs.sort(sortPredicate)
}
