import map from 'lodash/fp/map'
import reduce from 'lodash/fp/reduce'
import flatten from 'lodash/fp/flatten'
import compose from 'lodash/fp/compose'
import partition from 'lodash/fp/partition'

import db, { bulkGetResultsToArray } from 'src/pouchdb'
import { pageKeyPrefix } from 'src/page-storage'
import { convertMetaDocId, visitKeyPrefix } from 'src/activity-logger'

/**
 * @param {string} id ID of the doc to extract timestamp from.
 * @returns {number} Extracted timestamp as a number.
 */
const getTimestampFromId = id => +convertMetaDocId(id).timestamp

/**
* Given an augmented page doc (returned from `mapResultsToPouchDocs`), returns the timestamp of the
* latest associated meta (either bookmark or visit doc).
* @param {AugmentedPageDoc} pageDoc
* @returns {number} Timestamp of the latest associated meta doc, or MAX_INT if none (bad data).
*/
function grabLatestAssocMetaTimestamp({ assoc }) {
    let latest = Number.MAX_SAFE_INTEGER

    // If both visit and bookmark exist, return the latest of both
    if (assoc.visit && assoc.bookmark) {
        const visit = getTimestampFromId(assoc.visit._id)
        const bookmark = getTimestampFromId(assoc.bookmark._id)
        latest = visit > bookmark ? visit : bookmark
    } else if (assoc.visit) {
        latest = getTimestampFromId(assoc.visit._id)
    } else if (assoc.bookmark) {
        latest = getTimestampFromId(assoc.bookmark._id)
    }

    return latest
}

/**
* Returns the latest bookmark or visit doc from index results + IDs of the later metas.
* @param {Array<string>} metaIds Array of IDs to sort and extract latest from.
* @param {any} timeFilters Time filters of the search query, if any.
* @returns {any} Object containing `latest` meta ID and ordered `rest` array.
*  `latest` should be `undefined` if input array length is 0.
*/
function getLatestMeta(metaIds = [], { startDate, endDate }) {
    const now = Date.now()
    // Filter out out-of-range meta IDs then sort them by time
    const sorted = metaIds
        .filter(id => getTimestampFromId(id) >= (startDate || 0) && getTimestampFromId(id) <= (endDate || now))
        .sort((idA, idB) => getTimestampFromId(idB) - getTimestampFromId(idA))

    if (!sorted.length) {
        return { latest: undefined, rest: [] }
    }

    // Split the latest result from the rest
    const [latest, ...rest] = sorted
    return { latest, rest }
}

/**
* Creates a quick-lookup dictionary of page doc IDs to the associated meta doc IDs
* from our search-index results. The index result score is also kept for later sorting.
* @param {Array<any>} results Array of search-idnex results.
* @returns {any} Object with page ID keys and values containing either bookmark or visit or both docs.
*/
const createResultIdsDict = timeFilters => reduce((acc, result) => ({
    ...acc,
    [result.document.id]: {
        pageId: result.document.id,
        visitIds: getLatestMeta(result.document.visits, timeFilters),
        bookmarkIds: getLatestMeta(result.document.bookmarks, timeFilters),
        score: result.score,
    },
}), {})

/**
* @param {any} dict Lookup dictionary returned from `createResultIdsDict`.
* @returns {Array<any>} Array of `{ id: string }`, ready for injestion into `PouchDB.bulkGet`.
*/
const formatBulkGetInput = compose(
    flatten,
    map(idBatch => [
        { id: idBatch.pageId },
        { id: idBatch.visitIds.latest },
        { id: idBatch.bookmarkIds.latest },
    ].filter(doc => doc.id != null)) // Filter out missing metas
)

/**
* Creates a quick-lookup dictionary of page doc IDs to the associated meta doc contents
* from an array of meta doc inputs.
* @param {Array<any>} metaDocs Array of meta docs to map page IDs to.
* @returns {any} Object with page ID keys and values containing either bookmark or visit or both docs.
*/
const createMetaDocsDict = reduce((acc, metaDoc) => {
    const key = metaDoc._id.startsWith(visitKeyPrefix) ? 'visit' : 'bookmark'

    // Merge with existing bookmark/visit if present, else create new
    const newEntry = acc[metaDoc.page._id]
        ? { ...acc[metaDoc.page._id], [key]: metaDoc }
        : { [key]: metaDoc }

    return {
        ...acc,
        [metaDoc.page._id]: newEntry,
    }
}, {})

// Sort predicates based on time and search relevance
const sortByTime = () => (docA, docB) =>
    grabLatestAssocMetaTimestamp(docB) - grabLatestAssocMetaTimestamp(docA)

const sortByRelevance = resultIdsDict => (docA, docB) =>
    resultIdsDict[docA._id].score - resultIdsDict[docB._id].score

/**
* Performs all the messy logic needed to resolve search-index results against our PouchDB model.
* Given n results, should produce n page docs with associated meta docs available under `assoc` key.
* For the sake of differentiation, call these "augmented page docs".
* The latest visit/bookmark doc should be available on the page doc (assuming they exist), while
* all later metas will only be as _ids to avoid large fetches in the cases of pages with large
* number of assoc. meta docs (they can be lazy fetched later on user actions).
*
* TODO: All this resolution is messy as hell; is there a better way?
*
* @param {Array<any>} results Array of results gotten from our search-index query.
* @param {any} timeFilters Time filters of the search query, if any.
* @param {boolean} [shouldSortByTime=false] Whether or not to order results by time.
* @returns {Array<any>} Array of augmented page docs containing linked meta docs.
*/
export default async function mapResultsToPouchDocs(results, timeFilters, shouldSortByTime = false) {
    // Convert results to dictionary of page IDs to related meta IDs
    const resultIdsDict = createResultIdsDict(timeFilters)(results)

    // Format IDs of docs needed to be immediately fetched from Pouch
    const bulkGetInput = formatBulkGetInput(resultIdsDict)

    // Perform bulk fetch for needed docs from pouch
    const bulkRes = await db.bulkGet({ docs: bulkGetInput })
    const docs = bulkGetResultsToArray(bulkRes)

    // Parition into meta and page docs
    const [pageDocs, metaDocs] = partition(doc => doc._id.startsWith(pageKeyPrefix))(docs)

    // Insert meta docs into the relevant page docs,
    //  including later meta doc IDs, within the `pageDoc.assoc` key
    const metaDocsDict = createMetaDocsDict(metaDocs)
    const augmentedPageDocs = pageDocs.map(doc => ({
        ...doc,
        assoc: {
            ...metaDocsDict[doc._id],
            laterVisits: resultIdsDict[doc._id].visitIds.rest,
            laterBookmarks: resultIdsDict[doc._id].bookmarkIds.rest,
        },
    }))

    // Perform time-based sort if default query (based on greatest meta doc time)
    const sortPredicate = shouldSortByTime ? sortByTime() : sortByRelevance(resultIdsDict)

    // Ensure the original results order is maintained, if specified
    return augmentedPageDocs.sort(sortPredicate)
}
