import db from 'src/pouchdb'
import { IMPORT_TYPE } from 'src/options/imports/constants'
import { pageKeyPrefix, convertPageDocId } from 'src/page-storage'
import { bookmarkKeyPrefix, convertBookmarkDocId } from 'src/bookmarks'
import {
    getOldExtItems,
    getURLFilteredBookmarkItems,
    getURLFilteredHistoryItems,
} from './'

/**
 * Counts the associated _full_ page docs for each bookmark doc. Stubs are ignored. Does them
 * one-at-a-time instead of a map reduce, to avoid spamming DB with queries.
 * @param {Array<IBookmarkDoc>} bookmarkDocs Array of found bookmark docs to count associated full page docs.
 * @returns {number} Count of _full_ page docs associated with all bookmark docs.
 */
async function getAssocFullPageDocCount(bookmarkDocs) {
    let count = 0
    for (const doc of bookmarkDocs) {
        try {
            const { url } = convertBookmarkDocId(doc._id)
            await db.get(convertPageDocId({ url }))
            ++count
        } catch (err) {}
    }
    return count
}

/**
 * Handles calculating the estimate counts for history and bookmark imports.
 * @returns {any} The state containing import estimates completed and remaining counts.
 */
export default async function getEstimateCounts() {
    // Grab needed data from browser API (filtered by whats already in DB)
    const historyItemsMap = await getURLFilteredHistoryItems()
    const bookmarkItemsMap = await getURLFilteredBookmarkItems()
    const oldExtItems = await getOldExtItems()

    // Grab needed data from DB
    const { rows: pageDocs } = await db.allDocs({
        startkey: pageKeyPrefix,
        endkey: `${pageKeyPrefix}\uffff`,
    })
    const { rows: bookmarkDocs } = await db.allDocs({
        startkey: bookmarkKeyPrefix,
        endkey: `${bookmarkKeyPrefix}\uffff`,
    })

    return {
        completed: {
            [IMPORT_TYPE.HISTORY]: pageDocs.length,
            [IMPORT_TYPE.BOOKMARK]: await getAssocFullPageDocCount(
                bookmarkDocs,
            ),
            [IMPORT_TYPE.OLD]: oldExtItems.completedCount,
        },
        remaining: {
            [IMPORT_TYPE.HISTORY]: historyItemsMap.size,
            [IMPORT_TYPE.BOOKMARK]: bookmarkItemsMap.size,
            [IMPORT_TYPE.OLD]: oldExtItems.importItemsMap.size,
        },
    }
}
