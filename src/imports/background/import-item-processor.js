import { dataURLToBlob } from 'blob-util'

import db from 'src/pouchdb'
import { generatePageDocId } from 'src/page-storage'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { revisePageFields } from 'src/page-analysis'
import { IMPORT_TYPE, DOWNLOAD_STATUS } from 'src/options/imports/constants'
import * as index from 'src/search/search-index'
import { transformToVisitDoc, transformToBookmarkDoc } from 'src/imports'

const fetchPageDataOpts = {
    includePageContent: true,
    includeFavIcon: true,
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
 * @param {PageDoc} pageDoc Page doc to get visits and create visit docs for.
 * @returns {Array<IVisitDoc>} Array of visit docs gotten from URLs in `pageDoc`.
 */
async function createAssociatedVisitDocs(pageDoc) {
    const visitItems = await browser.history.getVisits({ url: pageDoc.url })

    return visitItems.map(transformToVisitDoc(pageDoc))
}

async function createAssociatedBookmarkDoc(pageDoc, importItem) {
    // Web Ext. API should return array of BookmarkItems; grab first one
    const [bookmarkItem] = await browser.bookmarks.get(importItem.browserId)

    return transformToBookmarkDoc(pageDoc)(bookmarkItem)
}

/**
 * Handles processing of a history-type import item. Checks for exisitng page docs that have the same URL.
 *
 * @param {IImportItem} importItemDoc
 * @returns {any} Status string denoting the outcome of import processing as `status`
 *  + optional filled-out page doc as `pageDoc` field.
 */
async function processHistoryImport(importItem) {
    
    // Do the page data fetch
    const { content, favIconURI } = await fetchPageData({ url: importItem.url, opts: fetchPageDataOpts })

    // Sort out all binary attachments
    const _attachments = await formatFavIconAttachment(favIconURI)

    // Construct the page doc ready for PouchDB from fetched + import item data
    const pageDoc = revisePageFields({
        _id: generatePageDocId({ url: importItem.url }),
        url: importItem.url,
        content,
        _attachments,
    })

    // Fetch and create meta-docs
    const visitDocs = await createAssociatedVisitDocs(pageDoc)
    const bookmarkDocs = importItem.type === IMPORT_TYPE.BOOKMARK
        ? [await createAssociatedBookmarkDoc(pageDoc, importItem)]
        : []

    // Schedule indexing of searchable data, but don't wait for it
    console.time('index-time')
    await index.addPage({ pageDoc, visitDocs, bookmarkDocs })
    console.timeEnd('index-time')
    // Store the new data in Pouch
    await db.bulkDocs([pageDoc, ...bookmarkDocs, ...visitDocs])
    
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
    console.time('import-time-total')
    switch (importItem.type) {
        case IMPORT_TYPE.BOOKMARK:
        case IMPORT_TYPE.HISTORY: return await processHistoryImport(importItem)
        default: throw new Error('Unknown import type')
    }
    console.timeEnd('import-time-total')
}
