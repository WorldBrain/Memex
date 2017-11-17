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
 * @returns {Promise<any>} The state containing import estimates completed counts for each import type.
 */
async function calcCompletedCounts() {
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
        [IMPORT_TYPE.HISTORY]: completedHistory < 0 ? 0 : completedHistory,
        [IMPORT_TYPE.BOOKMARK]: bookmarkDocs.length,
        [IMPORT_TYPE.OLD]: numOldExtDone,
    }
}

export default async (forceRecalc = false, hoursToLive = 24) => {
    // First check to see if we can use prev. calc'd values
    let finalResult
    const prevResult = await getStoredEsts()

    // If saved calcs are recent, just use them
    if (
        !forceRecalc &&
        prevResult.calculatedAt >
            moment()
                .subtract(hoursToLive, 'hours')
                .valueOf()
    ) {
        finalResult = prevResult
    } else {
        // Else, do calculations
        finalResult = {
            completedCounts: await calcCompletedCounts(),
            remaining: await createImportItems(),
        }

        setStoredEsts(finalResult) // Save current calculations for next time
    }

    return finalResult
}
