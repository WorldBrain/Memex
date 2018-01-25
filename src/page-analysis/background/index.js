import { dataURLToBlob } from 'blob-util'

import { whenPageDOMLoaded } from 'src/util/tab-events'
import { remoteFunction } from 'src/util/webextensionRPC'
import whenAllSettled from 'when-all-settled'
import db from 'src/pouchdb'
import updateDoc, { setAttachment } from 'src/util/pouchdb-update-doc'

import { revisePageFields } from '..'
import getFavIcon from './get-fav-icon'
import makeScreenshot from './make-screenshot'

const getAttachmentHandler = (pageId, attachment) =>
    async function(dataUrl) {
        if (dataUrl == null) {
            return
        }
        const blob = await dataURLToBlob(dataUrl)
        await setAttachment(db, pageId, attachment, blob)
    }

// Extract interesting stuff from the current page and store it.
async function performPageAnalysis({ pageId, tabId }) {
    // Run these functions in the content script in the tab.
    const extractPageContent = remoteFunction('extractPageContent', { tabId })

    // Get and store the fav-icon
    const storeFavIcon = getFavIcon({ tabId }).then(
        getAttachmentHandler(pageId, 'favIcon'),
    )

    // Capture a screenshot.
    const storeScreenshot = makeScreenshot({ tabId }).then(
        getAttachmentHandler(pageId, 'screenshot'),
    )

    // Extract the text and metadata
    // Add the info to the doc's (possibly already existing) doc.content.
    const storePageContent = extractPageContent().then(content =>
        updateDoc(db, pageId, doc => ({
            ...doc,
            content: { ...doc.content, ...content },
        })),
    )

    // When every task has either completed or failed, update the search index.
    await whenAllSettled([storeFavIcon, storeScreenshot, storePageContent])
}

/**
 * Performs page content analysis and storage for an existing page doc in Pouch.
 *
 * @param {string} args.pageId ID of pouch doc to add analysed content to.
 * @param {number} args.tabId ID of browser tab to use as data source.
 * @returns {Promise<IPageDoc>} Resolves to the stored page doc in post-analysis state.
 */
export default async function analysePage({ pageId, tabId }) {
    // Wait until its DOM has loaded, in case we got invoked before that.
    await whenPageDOMLoaded({ tabId }) // TODO: catch e.g. tab close.
    await performPageAnalysis({ pageId, tabId })
    return revisePageFields(await db.get(pageId))
}
