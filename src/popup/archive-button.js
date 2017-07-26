import db from 'src/pouchdb'
import last from 'lodash/fp/last'
import { pageDocsSelector } from 'src/page-storage'
import updateDoc from 'src/util/pouchdb-update-doc'

/**
 * Attempts to get the ID of the page doc matching the current tab.
 * @param {string} url The URL to try to get page doc from
 * @return {string} The ID of the matching page doc
 * @throws Will throw an error if:
 *  - matching page doc/s not found
 *  - matching page doc already has freeze-dry flag set
 */
export async function getPageDocId(url) {
    const selector = { ...pageDocsSelector, url }
    const { docs } = await db.find({ selector, fields: ['_id', 'keepFreezeDry'] })

    if (!docs || !docs.length) {
        throw new Error('Cannot find page doc matching current tab for archiving')
    }

    const latestPageDoc = last(docs) // Latest should be at the end

    // If freeze-dry flag already set, no need to attempt to set it again
    if (latestPageDoc.keepFreezeDry) {
        throw new Error('Freeze-dry flag already set')
    }

    return latestPageDoc._id
}

// Set flag on matching page doc on archive button press.
// Flag says to save associated freeze-dry (others cleaned up over time)
export const updateArchiveFlag = docId => updateDoc(db, docId, doc => {
    doc.keepFreezeDry = true
    return doc
})
