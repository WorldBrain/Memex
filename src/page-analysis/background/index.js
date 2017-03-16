import assocPath from 'lodash/fp/assocPath'

import { whenPageDOMLoaded } from '../../util/tab-events'
import { remoteFunction } from '../../util/webextensionRPC'
import whenAllSettled from '../../util/when-all-settled'
import db from '../../pouchdb'
import { updatePageSearchIndex } from '../../search/find-pages'

import { revisePageFields } from '..'
import getFavIcon from './get-fav-icon'
import makeScreenshot from './make-screenshot'


// Extract interesting stuff from the current page and store it.
function performPageAnalysis({pageId, tabId}) {

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

    return whenAllSettled([
        storePageMetadata,
        storePageText,
        storeFavIcon,
        storeScreenshot,
    ], {
        onRejection: err => console.error(err)
    }).then(
        // Update search index
        () => updatePageSearchIndex()
    )

}

export default async function analysePage({page, tabId}) {
    // Wait until its DOM has loaded.
    await whenPageDOMLoaded({tabId}) // TODO: catch e.g. tab close.
    await performPageAnalysis({pageId: page._id, tabId})
    // Get and return the page.
    page = revisePageFields(await db.get(page._id))
    return {page}
}
