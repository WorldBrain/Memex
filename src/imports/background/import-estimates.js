import db from 'src/pouchdb'
import { IMPORT_TYPE } from 'src/options/imports/constants'
import { pageDocsSelector } from 'src/page-storage'
import { bookmarkDocsSelector } from 'src/bookmarks'
import { getURLFilteredBookmarkItems, getURLFilteredHistoryItems } from './'

// As we're just getting counts, most queries will want to limit output fields to just `_id`
const fields = ['_id']
const nonStubPages = { ...pageDocsSelector, isStub: { $ne: true } }

/**
 * Counts the associated _full_ page docs for each bookmark doc. Stubs are ignored. Does them
 * one-at-a-time instead of a map reduce, to avoid spamming DB with queries.
 * @param {Array<IBookmarkDoc>} bookmarkDocs Array of found bookmark docs to count associated full page docs.
 * @returns {number} Count of _full_ page docs associated with all bookmark docs.
 */
async function getAssocFullPageDocCount(bookmarkDocs) {
    let count = 0
    for (const doc of bookmarkDocs) {
        const { docs: [assocPageDoc] } = await db.find({ selector: { ...nonStubPages, _id: doc.page._id }, fields })
        if (assocPageDoc) ++count
    }
    return count
}

/**
 * Handles calculating the estimate counts for history and bookmark imports.
 * @returns {any} The state containing import estimates completed and remaining counts.
 */
export default async function getEstimateCounts() {
    // Grab needed data from browser API (filtered by whats already in DB)
    const filteredHistoryItems = await getURLFilteredHistoryItems()
    const filteredBookmarkItems = await getURLFilteredBookmarkItems()

    // Grab needed data from DB
    const { docs: pageDocs } = await db.find({ selector: nonStubPages, fields })
    const { docs: bookmarkDocs } = await db.find({ selector: bookmarkDocsSelector, fields: ['_id', 'page'] })

    return {
        completed: {
            [IMPORT_TYPE.HISTORY]: pageDocs.length,
            [IMPORT_TYPE.BOOKMARK]: await getAssocFullPageDocCount(bookmarkDocs),
        },
        remaining: {
            [IMPORT_TYPE.HISTORY]: filteredHistoryItems.length,
            [IMPORT_TYPE.BOOKMARK]: filteredBookmarkItems.length,
        },
    }
}
