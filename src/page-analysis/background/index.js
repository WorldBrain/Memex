import assocPath from 'lodash/fp/assocPath'
import merge from 'lodash/fp/merge'
import { dataURLToBlob } from 'blob-util'

import { whenPageDOMLoaded, whenPageLoadComplete, whenTabActive } from 'src/util/tab-events'
import { remoteFunction } from 'src/util/webextensionRPC'
import whenAllSettled from 'src/util/when-all-settled'
import delay from 'src/util/delay'
import db from 'src/pouchdb'
import updateDoc from 'src/util/pouchdb-update-doc'

import { revisePageFields } from '..'
import getFavIcon from './get-fav-icon'
import makeScreenshot from './make-screenshot'
import fetchPageDataInBackground from './fetch-page-data'


// Extract interesting stuff from the current page and store it.
async function performPageAnalysis({pageId, tabId}) {
    // Run these functions in the content script in the tab.
    const extractPageContent = remoteFunction('extractPageContent', {tabId})
    const freezeDry = remoteFunction('freezeDry', {tabId})

    // A shorthand for adding an attachment to a doc.
    const setDocAttachment = (db, docId, attachmentId) => async blob => {
        await updateDoc(db, docId,
            doc => assocPath(
                ['_attachments', attachmentId],
                {content_type: blob.type, data: blob}
            )(doc)
        )
    }

    // Get and store the fav-icon
    const storeFavIcon = getFavIcon({tabId}).then(async dataUri => {
        if (dataUri === undefined) return
        const blob = await dataURLToBlob(dataUri)
        await setDocAttachment(db, pageId, 'favIcon')(blob)
    })

    // Capture a screenshot.
    const storeScreenshot = makeScreenshot({tabId}).then(async dataUri => {
        if (dataUri === undefined) return
        const blob = await dataURLToBlob(dataUri)
        await setDocAttachment(db, pageId, 'screenshot')(blob)
    })

    // Extract the text and metadata
    const storePageContent = extractPageContent().then(async content => {
        // Add the info to the doc's (possibly already existing) doc.content.
        await updateDoc(db, pageId, doc => merge({content})(doc))
    })

    // Freeze-dry and store the whole page
    async function storePageFreezeDried() {
        await whenPageLoadComplete({tabId})
        // Wait a bit to first let scripts run. TODO Do this in a smarter way.
        await delay(1000)
        // Wait until the tab is activated (to match with screenshot).
        await whenTabActive({tabId})
        const htmlString = await freezeDry()
        const blob = new Blob([htmlString], {type: 'text/html;charset=UTF-8'})
        await setDocAttachment(db, pageId, 'frozen-page.html')(blob)
    }

    // When every task has either completed or failed, update the search index.
    await whenAllSettled([
        storeFavIcon,
        storeScreenshot,
        storePageContent,
        storePageFreezeDried(),
    ])
}

/**
 * Performs in-tab page analysis for a given page document, fetching and storing
 * further page data such as text and metadata.
 *
 * @param {page} page The page document to save analysis data to.
 * @param {tabId} string The ID of the tab to perform page data extraction in.
 * @returns {page} The updated page document containing any extra data found in analysis.
 */
export async function analysePageInTab({page, tabId}) {
    // Wait until its DOM has loaded.
    await whenPageDOMLoaded({tabId}) // TODO: catch e.g. tab close.
    await performPageAnalysis({pageId: page._id, tabId})
    // Get and return the page.
    page = revisePageFields(await db.get(page._id))
    return {page}
}

/**
 * Performs background page analysis for a given page document, fetching and storing
 * further page data such as text and metadata.
 *
 * @param {page} page The page document to save analysis data to.
 * @param {url} string The URL pointing to the data source for page data extraction.
 * @returns {page} The updated page document containing any extra data found in analysis.
 */
export async function analysePageInBackground({ page, url }) {
    // Run page data fetching in background
    const extractPageContent = () => fetchPageDataInBackground({ url })

    await performPageAnalysis({ pageId: page._id, extractPageContent })
    // Get and return the page.
    const revisedPage = revisePageFields(await db.get(page._id))
    return { page: revisedPage }
}
