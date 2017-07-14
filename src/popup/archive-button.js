import db from 'src/pouchdb'
import last from 'lodash/fp/last'
import { pageDocsSelector } from 'src/page-storage'
import updateDoc from 'src/util/pouchdb-update-doc'

export const archiveBtn = document.getElementById('archive-button')

/**
 * Attempts to get the ID of the page doc matching the current tab.
 * @return {string} The ID of the matching page doc
 * @throws Will throw an error if:
 *  - URL cannot be gotten from tab
 *  - matching page doc/s not found
 *  - matching page doc already has freeze-dry flag set
 */
const getCurrentTabPageDocId = async () => {
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

const setFreezeDryFlag = doc => {
    doc.keepFreezeDry = true
    return doc
}

// On popup load, attempt to resolve current tab to a page doc, for archive button
window.onload = async () => {
    archiveBtn.disabled = true // Initial state is disabled as it needs an async computation to check
    try {
        const pageDocId = await getCurrentTabPageDocId()
        archiveBtn.dataset.pageDocId = pageDocId // Set data att on button with page ID ready
        archiveBtn.disabled = false
    } catch (error) {
        // Cannot get page doc ID associated with this page; leave button disabled
    }
}

// Set flag on matching page doc on archive button press.
// Flag says to save associated freeze-dry (others cleaned up over time)
archiveBtn.addEventListener('click', async event => {
    event.preventDefault()
    try {
        await updateDoc(db, archiveBtn.dataset.pageDocId, setFreezeDryFlag)
    } catch (error) {
        // Something bad happened; cannot update the freeze-dry flag
        console.error(error)
    } finally {
        window.close()
    }
})
