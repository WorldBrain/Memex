import db from 'src/pouchdb'
import { differMaps } from 'src/util/map-set-helpers'
import { IMPORT_TYPE, OLD_EXT_KEYS } from 'src/options/imports/constants'
import { pageKeyPrefix } from 'src/page-storage'
import { bookmarkKeyPrefix } from 'src/bookmarks'
import createImportItems from './import-item-creation'

/**
 * Handles calculating the estimate counts for history and bookmark imports.
 *
 * @returns {Promise<any>} The state containing import estimates completed and remaining counts for each import type.
 */
export default async function getEstimateCounts() {
    // Grab needed data from browser API (filtered by whats already in DB)
    const items = await createImportItems()

    // Perform set difference on import item Maps in same way they are merged
    //  (old ext items take precedence over bookmarks, which take precendence over history)
    const bookmarkItemsMap = differMaps(items.oldExtItemsMap)(
        items.bookmarkItemsMap,
    )
    const historyItemsMap = differMaps(bookmarkItemsMap)(items.historyItemsMap)

    // Grab existing data counts from DB
    const { rows: pageDocs } = await db.allDocs({
        startkey: pageKeyPrefix,
        endkey: `${pageKeyPrefix}\uffff`,
    })
    const { rows: bookmarkDocs } = await db.allDocs({
        startkey: bookmarkKeyPrefix,
        endkey: `${bookmarkKeyPrefix}\uffff`,
    })
    const {
        [OLD_EXT_KEYS.NUM_DONE]: numOldExtDone,
    } = await browser.storage.local.get({ [OLD_EXT_KEYS.NUM_DONE]: 0 })

    // Can sometimes return slightly different lengths for unknown reason
    const completedHistory = pageDocs.length - bookmarkDocs.length

    return {
        completed: {
            [IMPORT_TYPE.HISTORY]: completedHistory < 0 ? 0 : completedHistory,
            [IMPORT_TYPE.BOOKMARK]: bookmarkDocs.length,
            [IMPORT_TYPE.OLD]: numOldExtDone,
        },
        remaining: {
            [IMPORT_TYPE.HISTORY]: historyItemsMap.size,
            [IMPORT_TYPE.BOOKMARK]: bookmarkItemsMap.size,
            [IMPORT_TYPE.OLD]: items.oldExtItemsMap.size,
        },
    }
}
