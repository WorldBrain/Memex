import db from 'src/pouchdb'
import { differMaps } from 'src/util/map-set-helpers'
import { IMPORT_TYPE } from 'src/options/imports/constants'
import { pageKeyPrefix } from 'src/page-storage'
import { bookmarkKeyPrefix } from 'src/bookmarks'
import {
    getOldExtItems,
    getURLFilteredBookmarkItems,
    getURLFilteredHistoryItems,
} from './'

/**
 * Handles calculating the estimate counts for history and bookmark imports.
 *
 * @returns {Promise<any>} The state containing import estimates completed and remaining counts for each import type.
 */
export default async function getEstimateCounts() {
    // Grab needed data from browser API (filtered by whats already in DB)
    let historyItemsMap = await getURLFilteredHistoryItems()
    let bookmarkItemsMap = await getURLFilteredBookmarkItems()
    const oldExtItems = await getOldExtItems()

    // Perform set difference on import item Maps in same way they are merged
    //  (old ext items take precedence over bookmarks, which take precendence over history)
    bookmarkItemsMap = differMaps(oldExtItems.importItemsMap)(bookmarkItemsMap)
    historyItemsMap = differMaps(bookmarkItemsMap)(historyItemsMap)

    // Grab existing data counts from DB
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
            [IMPORT_TYPE.HISTORY]: pageDocs.length - bookmarkDocs.length,
            [IMPORT_TYPE.BOOKMARK]: bookmarkDocs.length,
            [IMPORT_TYPE.OLD]: oldExtItems.completedCount,
        },
        remaining: {
            [IMPORT_TYPE.HISTORY]: historyItemsMap.size,
            [IMPORT_TYPE.BOOKMARK]: bookmarkItemsMap.size,
            [IMPORT_TYPE.OLD]: oldExtItems.importItemsMap.size,
        },
    }
}
