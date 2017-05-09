import assocPath from 'lodash/fp/assocPath'

import { whenPageDOMLoaded } from 'src/util/tab-events'
import { remoteFunction } from 'src/util/webextensionRPC'
import whenAllSettled from 'src/util/when-all-settled'
import db from 'src/pouchdb'
import { updatePageSearchIndex } from 'src/search/find-pages'

import { revisePageFields } from '..'
import makeScreenshot from './make-screenshot'
export { default as fetchPageData } from './fetch-page-data'

// A shorthand for updating a single field in a doc.
const setDocField = (db, docId, key) =>
    value => db.upsert(docId, doc => assocPath(key, value)(doc))

// Capture a screenshot
const storeScreenshot = (pageId, tabId) =>
    makeScreenshot({tabId}).then(setDocField(db, pageId, 'screenshot'))

// Extract the text, metadata and favicon
const storePageContent = (pageId, contentExtractor) => contentExtractor().then(
    value => {
        setDocField(db, pageId, 'extractedText')(value.text)
        setDocField(db, pageId, 'extractedMetadata')(value.metadata)
        setDocField(db, pageId, 'favIcon')(value.favIcon)
    }
)

const getRevisedPage = async pageId => revisePageFields(await db.get(pageId))

/**
 * Performs in-tab page analysis for a given page document, fetching and storing
 * further page data such as text and metadata.
 *
 * @param {page} page The page document to save analysis data to.
 * @param {tabId} string The ID of the tab to perform page data extraction in.
 * @returns {page} The updated page document containing any extra data found in analysis.
 */
export async function analysePageInTab({ page, tabId }) {
    // Wait until its DOM has loaded.
    await whenPageDOMLoaded({tabId}) // TODO: catch e.g. tab close.

    // Run page data fetching in content script in the tab.
    await whenAllSettled([
        storeScreenshot(page._id, tabId),
        storePageContent(page._id, remoteFunction('extractPageContent', { tabId })),
    ])
    await updatePageSearchIndex()

    return { page: await getRevisedPage(page._id) }
}
