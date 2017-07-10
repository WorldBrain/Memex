import qs from 'query-string'
import last from 'lodash/fp/last'

import db from 'src/pouchdb'
import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter.js'
import { pageDocsSelector } from 'src/page-storage'
import updateDoc from 'src/util/pouchdb-update-doc'

const overviewURL = 'overview/overview.html'
const input = document.getElementById('search')
const archiveBtn = document.getElementById('archive-button')

/**
 * Attempts to get the ID of the page doc matching the current tab.
 * @return {string} The ID of the matching page doc
 * @throws Will throw an error if URL cannot be gotten from tab or matching page docs not found.
 */
const getCurrentTabPageDocId = async () => {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true })

    if (!currentTab || !currentTab.url) {
        throw new Error('Cannot get current tab to archive pages for')
    }

    const selector = { ...pageDocsSelector, url: currentTab.url }
    const { docs } = await db.find({ selector, fields: ['_id'] })

    if (!docs || !docs.length) {
        throw new Error('Cannot find page doc matching current tab for archiving')
    }

    return last(docs)._id // Latest should be at the end
}

const setFreezeDryFlag = doc => {
    doc.keepFreezeDry = true
    return doc
}

input.addEventListener('keydown', event => {
    if (event.keyCode === 13) { // If 'Enter' pressed
        event.preventDefault() // So the form doesn't submit

        const { extractedQuery: query, startDate, endDate } = extractTimeFiltersFromQuery(input.value)
        const queryParams = qs.stringify({ query, startDate, endDate })

        browser.tabs.create({ url: `${overviewURL}?${queryParams}` }) // New tab with query
        window.close() // Close the popup
    }
})

// Runs to set flag on matching page doc. Flag says to save associated freeze-dry (others cleaned up over time)
archiveBtn.addEventListener('click', async event => {
    event.preventDefault()

    try {
        const pageId = await getCurrentTabPageDocId()
        await updateDoc(db, pageId, setFreezeDryFlag)
    } catch (error) {
        // Something bad happened; cannot be archived
        console.error(error)
    } finally {
        window.close()
    }
})
