import { dataURLToBlob } from 'blob-util'

import db from 'src/pouchdb'
import updateDoc from 'src/util/pouchdb-update-doc'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { revisePageFields } from 'src/page-analysis'
import { IMPORT_TYPE, DOWNLOAD_STATUS } from 'src/options/imports/constants'

/**
 * @param {string?} favIconURL The data URL string for the favicon.
 * @returns {any} The `_attachments` entry to place into a PouchDB doc.
 */
const formatFavIconAttachment = async favIconURL => {
    if (!favIconURL) return undefined

    const blob = await dataURLToBlob(favIconURL)
    return { favIcon: { content_type: blob.type, data: blob } }
}

/**
 * Handles processing of a history-type import item. Checks for exisitng page docs that have the same URL.
 *
 * @param {IImportItem} importItemDoc
 * @returns {any} Status string denoting the outcome of import processing as `status`
 *  + optional filled-out page doc as `pageDoc` field.
 */
async function processHistoryImport(importItem) {
    let updateModifier = {} // Will contain the updates to make

    try {
        // Do the page data fetch
        const { content, favIconURI } = await fetchPageData(importItem)
        updateModifier = { ...updateModifier, content }

        // Sort out all binary attachments
        const _attachments = await formatFavIconAttachment(favIconURI)
        updateModifier = { ...updateModifier, _attachments }
    } catch (error) {
        // Let the batcher handle the error, but still allow the page stub to be marked off
        throw error
    } finally {
        // Perform the update: upadte page stub with available data and mark off stub flag
        await updateDoc(db, importItem.assocDocId, pageStub => revisePageFields({
            ...pageStub,
            ...updateModifier,
            isStub: false,
        }))
    }

    // If we finally got here without an error being thrown, return the success status message + pageDoc data
    return { status: DOWNLOAD_STATUS.SUCC }
}

/**
 * Given an import state item, performs appropriate processing depending on the import type.
 *
 * @param {IImportItem} importItem The import state item to process.
 * @returns {any} Status string denoting the outcome of import processing as `status`
 *  + optional filled-out page doc as `pageDoc` field.
 */
export default async function processImportItem(importItem = {}) {
    switch (importItem.type) {
        // There's really no difference between history and bookmarks at this stage, hence
        //  they use the same processing function to grab associated page data
        case IMPORT_TYPE.BOOKMARK:
        case IMPORT_TYPE.HISTORY: return await processHistoryImport(importItem)
        default: throw new Error('Unknown import type')
    }
}
