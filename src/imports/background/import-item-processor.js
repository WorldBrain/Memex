import { dataURLToBlob } from 'blob-util'

import db from 'src/pouchdb'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { revisePageFields } from 'src/page-analysis'
import { pageDocsSelector } from 'src/page-storage'
import { IMPORT_TYPE, DOWNLOAD_STATUS } from 'src/options/imports/constants'

/**
 * Binds a given doc type query selector to an fetching function which checks if a given URL
 * already exists in existing DB docs of the same type (excluding any stub docs) and returns them.
 *
 * @param {any} docSelector PouchDB find query selector for a specific type of docs.
 * @returns {(IImportItem) => Array<any>} Doc fetching function for same URL docs.
 */
const getExistingDocsFetcher = docSelector => async importItem => {
    const selector = { ...docSelector, url: importItem.url, isStub: { $ne: true } }
    const { docs } = await db.find({ selector, fields: ['_id', 'url'] })
    return docs
}

/**
 * @param {IImportItem} importItem The import item to attempt to find the page stub for.
 *   Assumes page stubs are unique via URL.
 */
const getAssociatedPageStub = async ({ url }) => {
    const selector = { ...pageDocsSelector, url, isStub: true }
    const { docs: [pageStub] } = await db.find({ selector })
    // If the page stub cannot be found for this URL, something has gone wrong...
    if (!pageStub) {
        throw new Error('Database error')
    }
    return pageStub
}

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
    // Run simplified URL checking logic first
    const fetchPagesWithSameURL = getExistingDocsFetcher(pageDocsSelector)
    const existingPages = await fetchPagesWithSameURL(importItem)

    // If URL deemed to exist in DB for these doc types, skip it
    if (existingPages.length !== 0) {
        return { status: DOWNLOAD_STATUS.SKIP }
    }

    // Do the page data fetch
    const { text, metadata, favIconURI } = await fetchPageData(importItem)

    // Get the page stub
    const pageStub = await getAssociatedPageStub(importItem)

    // Construct filled-out page doc
    const pageDoc = revisePageFields({
        ...pageStub,
        isStub: false,
        extractedText: text,
        extractedMetadata: metadata,
        _attachments: await formatFavIconAttachment(favIconURI),
    })

    // If we finally got here without an error being thrown, return the success status message + pageDoc data
    return { status: DOWNLOAD_STATUS.SUCC, pageDoc }
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
