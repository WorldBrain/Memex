import assocPath from 'lodash/fp/assocPath'
import { dataURLToBlob } from 'blob-util'

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
    const extractPageContent = remoteFunction('extractPageContent', {tabId})
    const freezeDry = remoteFunction('freezeDry', {tabId})

    // A shorthand for updating a single field in a doc.
    const setDocField = (db, docId, key) =>
        value => db.upsert(docId, doc => assocPath(key, value)(doc))

    // A shorthand for adding an attachment to a doc.
    const setDocAttachment = (db, docId, attachmentId) => blob =>
        db.upsert(docId, doc =>
            assocPath(
                ['_attachments', attachmentId],
                {content_type: blob.type, data: blob}
            )(doc)
        )

    // Get and store the fav-icon
    const storeFavIcon = getFavIcon({tabId}).then(async dataUri => {
        const blob = await dataURLToBlob(dataUri)
        await setDocAttachment(db, pageId, 'favIcon')(blob)
    })

    // Capture a screenshot.
    const storeScreenshot = makeScreenshot({tabId}).then(async dataUri => {
        const blob = await dataURLToBlob(dataUri)
        await setDocAttachment(db, pageId, 'screenshot')(blob)
    })

    // Extract the text and metadata
    const storePageContent = extractPageContent().then(
        value => {
            setDocField(db, pageId, 'extractedText')(value.text)
            setDocField(db, pageId, 'extractedMetadata')(value.metadata)
        }
    )

    // Freeze-dry and store the whole page
    const storePageFreezeDried = freezeDry().then(
        setDocField(db, pageId, 'html')
    )

    // When every task has either completed or failed, update the search index.
    await whenAllSettled([
        storeFavIcon,
        storeScreenshot,
        storePageContent,
        storePageFreezeDried,
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
