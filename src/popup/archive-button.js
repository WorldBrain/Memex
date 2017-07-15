import db from 'src/pouchdb'
import last from 'lodash/fp/last'
import { pageDocsSelector } from 'src/page-storage'
import updateDoc from 'src/util/pouchdb-update-doc'

/**
 * Attempts to get the ID of the page doc matching the current tab.
 * @return {string} The ID of the matching page doc
 * @throws Will throw an error if:
 *  - URL cannot be gotten from tab
 *  - matching page doc/s not found
 *  - matching page doc already has freeze-dry flag set
 */
export async function getCurrentTabPageDocId() {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true })

    if (!currentTab || !currentTab.url) {
        throw new Error('Cannot get current tab to archive pages for')
    }

    const selector = { ...pageDocsSelector, url: currentTab.url }
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
