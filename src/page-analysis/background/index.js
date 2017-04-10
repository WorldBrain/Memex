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
    // Run this function in the content script in the tab.
    const extractPageData = remoteFunction('extractPageData', {tabId})

    // A shorthand for updating a single field in a doc.
    const setDocField = (db, docId, key) =>
        value => db.upsert(docId, doc => assocPath(key, value)(doc))

    // Get and store the fav-icon
    const storeFavIcon = getFavIcon({tabId}).then(
        setDocField(db, pageId, 'favIcon')
    )

    // Capture a screenshot.
    const storeScreenshot = makeScreenshot({tabId}).then(
        setDocField(db, pageId, 'screenshot')
    )

    // Extract the Main text and Metadata
    const storePageData = extractPageData().then(
        (val) => {
            console.log('Data : \n' + JSON.stringify(val, null, 2))
            setDocField(db, pageId, 'extractedText')(val.pageText)
            setDocField(db, pageId, 'extractedMetaData')(val.pageMetaData)
        }
    )

    // When every task has either completed or failed, update the search index.
    await whenAllSettled([
        storePageData,
        storeFavIcon,
        storeScreenshot,
    ])
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
