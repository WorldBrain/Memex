import moment from 'moment'

import db from 'src/pouchdb'
import { IMPORT_TYPE, OLD_EXT_KEYS } from 'src/options/imports/constants'
import { pageKeyPrefix } from 'src/page-storage'
import { bookmarkKeyPrefix } from 'src/bookmarks'
import createImportItems from './import-item-creation'
import { getStoredEsts, setStoredEsts } from '../'

/**
 * Handles calculating the estimate counts for history and bookmark imports.
 *
 * @returns {Promise<any>} The state containing import estimates completed and remaining counts for each import type.
 */
async function calcEstimateCounts(items, shouldSaveRes = true) {
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

    const result = {
        completed: {
            [IMPORT_TYPE.HISTORY]: completedHistory < 0 ? 0 : completedHistory,
            [IMPORT_TYPE.BOOKMARK]: bookmarkDocs.length,
            [IMPORT_TYPE.OLD]: numOldExtDone,
        },
        remaining: {
            [IMPORT_TYPE.HISTORY]: items.historyItemsMap.size,
            [IMPORT_TYPE.BOOKMARK]: items.bookmarkItemsMap.size,
            [IMPORT_TYPE.OLD]: items.oldExtItemsMap.size,
        },
    }

    if (shouldSaveRes) {
        setStoredEsts(result) // Save current calculations for next time
    }

    return result
}

export default async ({ forceRecalc = false }) => {
    // First check to see if we can use prev. calc'd values
    const prevResult = await getStoredEsts()

    // If saved calcs are recent, just use them
    if (
        !forceRecalc &&
        prevResult.calculatedAt >
            moment()
                .subtract(1, 'day')
                .valueOf()
    ) {
        return prevResult
    }

    // Else, grab needed data from browser API (filtered by whats already in DB)
    const items = await createImportItems()
    // Re-run calculations (auto-saved)
    return await calcEstimateCounts(items)
}
