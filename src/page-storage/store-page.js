import { dataURLToBlob } from 'blob-util'

import db from 'src/pouchdb'
import updateDoc, { setAttachment } from 'src/util/pouchdb-update-doc'
import analysePage from 'src/page-analysis/background'
import { revisePageFields } from 'src/page-analysis'
import { generatePageDocId } from '.'

async function handleAttachment(pageId, attachment, dataUrl) {
    if (dataUrl == null) {
        return
    }
    const blob = await dataURLToBlob(dataUrl)
    await setAttachment(db, pageId, attachment, blob)
}

/**
 * Creates a page stub in PouchDB (or re-uses existing doc) and attempts to fill it out with current page content
 * sourced from browser tab via `page-analysis` module if specified.
 *
 * @param {number} args.tabId
 * @param {string} args.url
 * @param {any} args.* Any further static property values to include in stored page.
 * @param {boolean} [args.runAnalysis=true] Whether or not to run complex analysis via content script to extract
 *  further content data.
 * @returns {Promise<IPageDoc>} Resolves to the page doc stored, either with basic or post-analysis data depending on
 *  `runAnalysis` arg.
 */
export default async function storePage({
    tabId,
    url,
    runAnalysis = true,
    ...pageData
}) {
    const pageDocId = generatePageDocId({ url })
    let pageDoc

    // Ensure at least a stub for this page exists in Pouch, else re-use existing
    try {
        pageDoc = await db.get(pageDocId)
    } catch (error) {
        // Create a new page doc stub in the database if not found
        if (error.status === 404) {
            pageDoc = { _id: pageDocId, url, ...pageData }
            await db.put(pageDoc)
        } else {
            throw error // Can't handle other errors; throw up stack
        }
    }

    // Run analysis, if needed, + all doc updates
    if (runAnalysis) {
        const result = await analysePage({ tabId })

        if (result.screenshot) {
            await handleAttachment(pageDocId, 'screenshot', result.screenshot)
        }

        if (result.favIcon) {
            await handleAttachment(pageDocId, 'favIcon', result.favIcon)
        }

        await updateDoc(db, pageDocId, doc => ({
            ...doc,
            content: { ...doc.content, ...result.content },
        }))
    }

    pageDoc = revisePageFields(await db.get(pageDocId))

    return pageDoc
}
