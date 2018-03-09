import reduce from 'lodash/fp/reduce'

import db, {
    bulkGetResultsToArray,
    getAttachmentAsDataUrl,
} from '../../pouchdb'
import { removeKeyType } from './util'

/**
 * @param {Array<string>} timestamps
 * @param {string} endDate
 * @returns {number} Index of the element most closely being less than or equal to the `endDate`.
 */
const timestampsBinSearch = (timestamps = [], endDate = Date.now()) => {
    let min = 0
    let max = timestamps.length - 1
    let curr = -1

    while (min <= max) {
        curr = ((min + max) / 2) | 0

        if (timestamps[curr] < endDate) {
            min = curr + 1
        } else if (timestamps[curr] > endDate) {
            max = curr - 1
        } else {
            return curr
        }
    }

    return curr === 0 || timestamps[curr] < endDate ? curr : curr - 1
}

/**
 * @param {any} searchParams
 * @returns {(timestampsSet: Set<string>) => string} Function that returns latest timestamp in bookmarks/visits Set.
 */
const initFindLatestTime = ({ endDate }) => timestampsSet => {
    const timestamps = [...timestampsSet].map(removeKeyType).sort()

    return timestamps[timestampsBinSearch(timestamps, endDate)]
}

/**
 * @param {IndexLookupDoc} resultDoc Contains `visits` and `bookmarks` Sets.
 * @param {any} searchParams
 * @returns {string} Latest visit or bookmark timestamp, depending on available data.
 */
function getLatestTime({ visits, bookmarks }, searchParams) {
    const findLatest = initFindLatestTime(searchParams)

    // Only use bookmark times if no visits, or bookmarks filter on
    return !visits.size || searchParams.showOnlyBookmarks
        ? findLatest(bookmarks)
        : findLatest(visits)
}

/**
* Creates a quick-lookup dictionary of page doc IDs to the associated meta doc IDs
* from our search-index results. The index result score is also kept for later sorting.
* @param {Array<any>} results Array of search index results.
* @returns {Map<string, any>} Map with page ID keys and values containing needed search result data.
*/
const createResultsMap = searchParams =>
    reduce(
        (acc, [id, score, doc]) =>
            acc.set(id, {
                timestamp: +getLatestTime(doc, searchParams),
                score,
                hasBookmark: doc.bookmarks.size > 0,
                tags: [...(doc.tags || [])],
            }),
        new Map(),
    )

const sortByScore = resultsMap => (docA, docB) =>
    resultsMap.get(docB._id).score - resultsMap.get(docA._id).score

async function processAttachments(doc) {
    const res = {}

    if (!doc._attachments) {
        return res
    }

    if (doc._attachments.favIcon) {
        res.favIcon = await getAttachmentAsDataUrl({
            doc,
            attachmentId: 'favIcon',
        })
    }
    if (doc._attachments.screenshot) {
        res.screenshot = await getAttachmentAsDataUrl({
            doc,
            attachmentId: 'screenshot',
        })
    }
    return res
}

/**
* Performs all the messy logic needed to resolve search-index results against our PouchDB model.
* Given n results, should produce n page docs with the latest associated meta docs timestamps
* available under either `bookmark` or `visit` key, or both. For the sake of differentiation,
* call these "augmented page docs", and are generally only used by the overview.
*
* @param {Array<any>} results Array of results gotten from our search-index query.
* @param {any} searchParams Same params as main search entrypoint accepts.
* @returns {Array<any>} Array of augmented page docs containing linked meta doc timestamps.
*/
export default async function mapResultsToPouchDocs(results, searchParams) {
    // Convert results to dictionary of page IDs to related meta IDs
    const resultsMap = createResultsMap(searchParams)(results)

    // Format IDs of docs needed to be immediately fetched from Pouch
    const bulkGetInput = results.map(([id]) => ({ id }))

    // Perform bulk fetch for needed docs from pouch
    const bulkRes = await db.bulkGet({ docs: bulkGetInput })
    const pageDocs = bulkGetResultsToArray(bulkRes)

    // Augment the page docs with meta display info derived from search results
    const augmentedPageDocs = await Promise.all(
        pageDocs.map(async ({ _attachments, ...doc }) => ({
            ...doc,
            ...(await processAttachments({ _attachments, ...doc })),
            hasBookmark: resultsMap.get(doc._id).hasBookmark,
            displayTime: resultsMap.get(doc._id).timestamp,
            tags: resultsMap.get(doc._id).tags.map(removeKeyType),
        })),
    )

    // Ensure the original results order is maintained
    return augmentedPageDocs.sort(sortByScore(resultsMap))
}
