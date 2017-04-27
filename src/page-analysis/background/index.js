import assocPath from 'lodash/fp/assocPath'

import { whenPageDOMLoaded } from 'src/util/tab-events'
import { remoteFunction } from 'src/util/webextensionRPC'
import whenAllSettled from 'src/util/when-all-settled'
import db from 'src/pouchdb'
import { updatePageSearchIndex } from 'src/search/find-pages'

import { revisePageFields } from '..'
import getFavIcon from './get-fav-icon'
import makeScreenshot from './make-screenshot'
import fetchPageData from 'src/util/fetch-page-data'

// Extract interesting stuff from the current page and store it.
async function performPageAnalysis({pageId, tabId = '', extractPageContent}) {
    // A shorthand for updating a single field in a doc.
    const setDocField = (db, docId, key) =>
        value => db.upsert(docId, doc => assocPath(key, value)(doc))

    // Get and store the fav-icon (if tabId present)
    const storeFavIcon = tabId && getFavIcon({tabId}).then(
        setDocField(db, pageId, 'favIcon')
    )

    // Capture a screenshot (if tabId present).
    const storeScreenshot = tabId && makeScreenshot({tabId}).then(
        setDocField(db, pageId, 'screenshot')
    )

    // Extract the text and metadata
    const storePageContent = extractPageContent().then(
        value => {
            setDocField(db, pageId, 'extractedText')(value.text)
            setDocField(db, pageId, 'extractedMetadata')(value.metadata)
        }
    )

    // When every task has either completed or failed, update the search index.
    await whenAllSettled([
        storeFavIcon,
        storeScreenshot,
        storePageContent,
    ])
    await updatePageSearchIndex()
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

    // Run page data fetching in content script in the tab.
    const extractPageContent = remoteFunction('extractPageContent', {tabId})

    await performPageAnalysis({pageId: page._id, tabId, extractPageContent})
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
    const extractPageContent = () => fetchPageData({ url })

    await performPageAnalysis({ pageId: page._id, extractPageContent })
    // Get and return the page.
    const revisedPage = revisePageFields(await db.get(page._id))
    return { page: revisedPage }
}
