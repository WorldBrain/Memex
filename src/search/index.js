import map from 'lodash/fp/map'
import reduce from 'lodash/fp/reduce'
import flatten from 'lodash/fp/flatten'
import compose from 'lodash/fp/compose'
import partition from 'lodash/fp/partition'

import db from 'src/pouchdb'
import { pageKeyPrefix } from 'src/page-storage'
import { convertMetaDocId, visitKeyPrefix } from 'src/activity-logger'
import QueryBuilder from './query-builder'
import * as index from './search-index'

// Gets all the "ok" docs from Pouch bulk result, returning them as an array
// TODO: Try and make this nicer
const bulkResultsToArray = ({ results }) => results
    .map(res => res.docs)
    .map(list => list.filter(doc => doc.ok))
    .filter(list => list.length)
    .map(list => list[0].ok)

// Grabs the timestamp from a metadoc, formatting it to a Number
const getTimestampFromId = id => +convertMetaDocId(id).timestamp

/**
 * Given an augmented page doc (returned from `mapResultsToPouchDocs`), returns the ID of the
 * latest associated meta (either bookmark or visit doc).
 *
 * TODO: there may be cases of not-properly formatted data, which will result in null pointers;
 *  need to handle this.
 */
const grabLatestAssocMetaId = ({ assoc }) => {
    if (assoc.visit && assoc.bookmark) {
        // If both visit and bookmark exist, return the latest of each
        return assoc.visit > assoc.bookmark ? assoc.visit._id : assoc.bookmark._id
    } else if (assoc.visit) {
        return assoc.visit._id
    }
    return assoc.bookmark._id
}

/**
 * @param {Array<any>} augmentedPageDocs Array of augmented page docs (returned from `mapResultsToPouchDocs`)
 *  to sort by their latest associated meta doc timestamps.
 */
const sortByMetas = (augmentedPageDocs = []) =>
    augmentedPageDocs.sort((docA, docB) => {
        const timeA = getTimestampFromId(grabLatestAssocMetaId(docA))
        const timeB = getTimestampFromId(grabLatestAssocMetaId(docB))

        return timeB - timeA
    })

/**
 * Returns the latest bookmark or visit doc from index results + IDs of the later metas.
 * @param {Array<string>} metaIds Array of IDs to sort and extract latest from.
 * @param {any} timeFilters Time filters of the search query, if any.
 * @returns {any} Object containing `latest` meta ID and ordered `rest` array.
 *  `latest` should be `undefined` if input array length is 0.
 */
function getLatestMeta(metaIds = [], { startDate, endDate }) {
    const now = Date.now()
    // Filter out out-of-range metas then sort them by time
    const sorted = metaIds
        .filter(id => getTimestampFromId(id) >= (startDate || 0) && getTimestampFromId(id) <= (endDate || now))
        .sort((idA, idB) => getTimestampFromId(idB) - getTimestampFromId(idA))

    if (!sorted.length) {
        return { latest: undefined, rest: [] }
    }

    const [latest, ...rest] = sorted
    return { latest, rest }
}

/**
 * Creates a quick-lookup dictionary of page doc IDs to the associated meta doc IDs
 * from our search-index results.
 * @param {Array<any>} results Array of search-idnex results.
 * @returns {any} Object with page ID keys and values containing either bookmark or visit or both docs.
 */
const createResultIdsDict = timeFilters => reduce((acc, result) => ({
    ...acc,
    [result.document.id]: {
        pageId: result.document.id,
        visitIds: getLatestMeta(result.document.visitTimestamps, timeFilters),
        bookmarkIds: getLatestMeta(result.document.bookmarkTimestamps, timeFilters),
        score: result.score,
    },
}), {})

/**
 * Formats result IDs dict to format needed for injestion into `PouchDB.bulkGet`.
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

    // Merge with existing bookmark/visit if present
    if (acc[metaDoc.page._id]) {
        acc[metaDoc.page._id] = {
            ...acc[metaDoc.page._id],
            [key]: metaDoc,
        }
    } else {
        acc[metaDoc.page._id] = {
            [key]: metaDoc,
        }
    }

    return acc
}, {})

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
 * @param {boolean} [sortByRelevance=false] Whether or not to maintain relevance to search sort order.
 * @returns {Array<any>} Array of augmented page docs containing linked meta docs.
 */
async function mapResultsToPouchDocs(results, timeFilters, sortByRelevance = false) {
    // Convert results to dictionary of page IDs to related meta IDs
    const resultIdsDict = createResultIdsDict(timeFilters)(results)

    // Format IDs of docs needed to be immediately fetched from Pouch
    const bulkGetInput = formatBulkGetInput(resultIdsDict)

    // Perform bulk fetch for needed docs from pouch
    const bulkRes = await db.bulkGet({ docs: bulkGetInput })
    const docs = bulkResultsToArray(bulkRes)

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

    // Ensure the original results order is maintained, if specified
    return sortByRelevance
        ? augmentedPageDocs.sort((pageA, pageB) =>
            resultIdsDict[pageA._id].score - resultIdsDict[pageB._id].score)
        : augmentedPageDocs
}

export default async function indexSearch({
    query,
    startDate,
    endDate,
    skip,
    limit = 10,
}) {
    query = query.trim() // Don't count whitespace searches

    // Create SI query
    const indexQuery = new QueryBuilder()
        .searchTerm(query || '*') // Search by wildcard by default
        .startDate(startDate)
        .endDate(endDate)
        .skipUntil(skip || undefined)
        .limit(limit || 10)
        .get()
    console.log(indexQuery) // DEBUG

    // Using index results, fetch matching pouch docs
    const results = await index.find(indexQuery)

    // Short-circuit if no results
    if (!results.length) {
        return { docs: [], resultsExhausted: true }
    }

    let docs = await mapResultsToPouchDocs(results, { startDate, endDate }, query !== '')

    // Perform time-based sort if default query (based on greatest meta doc time)
    if (!query) {
        docs = sortByMetas(docs)
    }

    return {
        docs,
        resultsExhausted: results.length < limit,
    }
}
