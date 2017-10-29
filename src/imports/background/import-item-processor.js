import { dataURLToBlob } from 'blob-util'

import db from 'src/pouchdb'
import { generatePageDocId } from 'src/page-storage'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { revisePageFields } from 'src/page-analysis'
import { IMPORT_TYPE, DOWNLOAD_STATUS } from 'src/options/imports/constants'
import * as index from 'src/search'
import {
    transformToMinimalVisitDoc,
    transformToMinimalBookmarkDoc,
    transformToVisitDoc,
    transformToBookmarkDoc,
} from 'src/imports'

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

async function createPageDoc({ url }) {
    // Do the page data fetch
    const { content, favIconURI } = await fetchPageData({
        url,
        opts: fetchPageDataOpts,
    })

    // Sort out all binary attachments
    const _attachments = await formatFavIconAttachment(favIconURI)

    // Construct the page doc ready for PouchDB from fetched + import item data
    return revisePageFields({
        _id: generatePageDocId({ url }),
        url,
        content,
        _attachments,
    })
}

const storeDocs = ({ pageDoc, bookmarkDocs = [], visitDocs = [] }) =>
    Promise.all([
        index.addPageConcurrent({ pageDoc, visitDocs, bookmarkDocs }),
        db.bulkDocs([pageDoc, ...bookmarkDocs, ...visitDocs]),
    ])

/**
 * Handles processing of a history-type import item. Checks for exisitng page docs that have the same URL.
 *
 * @param {IImportItem} importItemDoc
 * @returns {any} Status string denoting the outcome of import processing as `status`
 *  + optional filled-out page doc as `pageDoc` field.
 */
async function processHistoryImport(importItem) {
    const pageDoc = await createPageDoc(importItem)

    // Fetch and create meta-docs
    const visitDocs = await createAssociatedVisitDocs(pageDoc)
    const bookmarkDocs = []

    if (importItem.type === IMPORT_TYPE.BOOKMARK) {
        bookmarkDocs.push(
            await createAssociatedBookmarkDoc(pageDoc, importItem),
        )
    }

    await storeDocs({ pageDoc, visitDocs, bookmarkDocs })

    // If we finally got here without an error being thrown, return the success status message + pageDoc data
    return { status: DOWNLOAD_STATUS.SUCC }
}

async function processOldExtImport(importItem) {
    const pageDoc = await createPageDoc(importItem)

    // Fetch and create meta-docs
    const visitDocs = await createAssociatedVisitDocs(pageDoc)
    const bookmarkDocs = []

    if (importItem.hasBookmark) {
        bookmarkDocs.push(transformToMinimalBookmarkDoc(pageDoc)(importItem))
    } else {
        visitDocs.push(transformToMinimalVisitDoc(pageDoc)(importItem))
    }

    await storeDocs({ pageDoc, visitDocs, bookmarkDocs })
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
        case IMPORT_TYPE.BOOKMARK:
        case IMPORT_TYPE.HISTORY:
            return await processHistoryImport(importItem)
        case IMPORT_TYPE.OLD:
            return await processOldExtImport(importItem)
        default:
            throw new Error('Unknown import type')
    }
}
