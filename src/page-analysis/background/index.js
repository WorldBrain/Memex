import assocPath from 'lodash/fp/assocPath'

import { whenPageDOMLoaded } from 'src/util/tab-events'
import { remoteFunction } from 'src/util/webextensionRPC'
import whenAllSettled from 'src/util/when-all-settled'
import db from 'src/pouchdb'
import { updatePageSearchIndex } from 'src/search/find-pages'

import { revisePageFields } from '..'
import getFavIcon from './get-fav-icon'
import makeScreenshot from './make-screenshot'


// Extract interesting stuff from the current page and store it.
async function performPageAnalysis({pageId, tabId}) {
    // Run these functions in the content script in the tab.
    const extractPageText = remoteFunction('extractPageText', {tabId})
    const extractPageMetadata = remoteFunction('extractPageMetadata', {tabId})

    // A shorthand for updating a single field in a doc.
    const setDocField = (db, docId, key) =>
        value => db.upsert(docId, doc => assocPath(key, value)(doc))

    // Get page title, author (if any), etcetera.
    const storePageMetadata = extractPageMetadata().then(
        setDocField(db, pageId, 'extractedMetadata')
    )

    // Get and store the fav-icon
    const storeFavIcon = getFavIcon({tabId}).then(
        setDocField(db, pageId, 'favIcon')
    )

    // Capture a screenshot.
    const storeScreenshot = makeScreenshot({tabId}).then(
        setDocField(db, pageId, 'screenshot')
    ).catch(
        err => console.error(err)
    )

    // Extract the main text
    const storePageText = extractPageText().then(
        setDocField(db, pageId, 'extractedText')
    )

    // When every task has either completed or failed, update the search index.
    await whenAllSettled([
        storePageMetadata,
        storePageText,
        storeFavIcon,
        storeScreenshot,
    ], {
        onRejection: err => console.error(err),
    })
    await updatePageSearchIndex()
}

export default async function analysePage({page, tabId}) {
    // Wait until its DOM has loaded.
    await whenPageDOMLoaded({tabId}) // TODO: catch e.g. tab close.
    await performPageAnalysis({pageId: page._id, tabId})
    // Get and return the page.
    page = revisePageFields(await db.get(page._id))
    return {page}
}
