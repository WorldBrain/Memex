import assocPath from 'lodash/fp/assocPath'
import merge from 'lodash/fp/merge'
import { dataURLToBlob } from 'blob-util'

import { whenPageDOMLoaded } from 'src/util/tab-events'
import { remoteFunction } from 'src/util/webextensionRPC'
import whenAllSettled from 'when-all-settled'
import db from 'src/pouchdb'
import updateDoc from 'src/util/pouchdb-update-doc'

import { revisePageFields } from '..'
import getFavIcon from './get-fav-icon'
import makeScreenshot from './make-screenshot'


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

export default async function analysePage({page, tabId}) {
    // Wait until its DOM has loaded, in case we got invoked before that.
    await whenPageDOMLoaded({tabId}) // TODO: catch e.g. tab close.
    await performPageAnalysis({pageId: page._id, tabId})
    // Get and return the page.
    page = revisePageFields(await db.get(page._id))
    return {page}
}
