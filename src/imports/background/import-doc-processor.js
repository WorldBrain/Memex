import flatten from 'lodash/flatten'

import db from 'src/pouchdb'
import { analysePageForImports as fetchAndAnalyse } from 'src/page-analysis/background'
import { generateVisitDocId, visitDocsSelector, convertVisitDocId } from 'src/activity-logger'
import { convertPageDocId, pageDocsSelector } from 'src/page-storage'
import { bookmarkDocsSelector, generateBookmarkDocId } from './'
import { IMPORT_TYPE, DOWNLOAD_STATUS } from 'src/options/imports/constants'

/**
 * Binds a given doc type query selector to an fetching function which checks if a given URL
 * already exists in existing DB docs (excluding the stub doc associated with the given import doc)
 * and returns them.
 *
 * @param {any} docSelector PouchDB find query selector for a specific type of docs.
 * @returns {(IImportDoc) => Array<any>} Doc fetching function for same URL docs.
 */
const getExistingDocsFetcher = docSelector => async ({ url, dataDocId }) => {
    const { docs } = await db.find({ selector: { ...docSelector, url }, fields: ['_id', 'url'] })

    // Ignore the page stub related to this import doc
    return docs.filter(doc => doc._id !== dataDocId)
}

/**
 * Converts a browser.history.VisitItem to our visit document model.
 *
 * @param {history.VisitItem} visitItem The VisitItem fetched from browser API.
 * @param {IPageDoc} assocPageDoc The page doc that contains the page data for this visit.
 * @returns {IVisitDoc} Newly created visit doc dervied from visitItem data.
 */
const transformToVisitDoc = (visitItem, assocPageDoc) => ({
    _id: generateVisitDocId({
        timestamp: visitItem.visitTime,
        // We set the nonce manually, to prevent duplicating items if
        // importing multiple times (thus making importHistory idempotent).
        nonce: visitItem.visitId,
    }),
    visitStart: visitItem.visitTime,
    referringVisitItemId: visitItem.referringVisitId,
    url: assocPageDoc.url,
    page: { _id: assocPageDoc._id },
})

/**
 * Converts a browser.bookmark.BookmarkTreeNode item to our bookmark document model.
 *
 * @param {bookmarks.BookmarkTreeNode} bookmarkItem The bookmark tree node item fetched from browser API.
 * @param {IPageDoc} assocPageDoc The page doc that contains the page data for this bookmark.
 * @returns {IBookmarkDoc} Newly created bookmark doc dervied from bookmarkItem data.
 */
const transformToBookmarkDoc = (bookmarkItem, assocPageDoc) => ({
    _id: generateBookmarkDocId({
        timestamp: bookmarkItem.dateAdded,
        nonce: bookmarkItem.id,
    }),
    title: bookmarkItem.title,
    url: bookmarkItem.url,
    page: { _id: assocPageDoc._id },
})

/**
 * Checks vist docs for existing docs. If any deemed missing create them,
 * add existing doc references, and insert.
 *
 * @param {Array<any>} existingDocs The existing docs to check visits docs for.
 */
async function processExistingDocVisits(existingDocs) {
    const visitPs = existingDocs.map(async existingDoc => {
        const { url } = existingDoc

        // Fetch needed data
        const { docs: visitDocs } = await db.find({ selector: { ...visitDocsSelector, url }, fields: ['_id'] })
        const visitItems = await browser.history.getVisits({ url })

        // Project out stored browser IDs from existing visit docs for easy comparison
        // Note that the _id's nonce contains the browser ID
        const savedVisitIds = visitDocs.map(doc => convertVisitDocId(doc._id).nonce)

        // Create visit docs for any VisitItem not present in DB
        const newVisitDocs = []
        visitItems.forEach(visitItem => {
            if (!savedVisitIds.includes(visitItem.visitId)) {
                newVisitDocs.push(transformToVisitDoc(visitItem, existingDoc))
            }
        })
        return newVisitDocs
    })

    const missingVisitDocs = flatten(await Promise.all(visitPs))
    if (missingVisitDocs.length > 0) {
        await db.bulkDocs(missingVisitDocs)
    }
}

/**
 * Process all visit docs for a to-be-processed import doc.
 *
 * @param {IImportDoc} importDoc
 */
async function processNewDocVisits({ url, dataDocId }) {
    const visitItems = await browser.history.getVisits({ url })
    const visitDocs = visitItems.map(visitItem => transformToVisitDoc(visitItem, { _id: dataDocId, url }))

    if (visitDocs.length > 0) {
        await db.bulkDocs(visitDocs)
    }
}

/**
 * Handles processing of a history-type import doc. Checks for exisitng page docs that have the same
 * URL and visit docs associated with the URL. Depending on the existence of these docs, new visit or
 * page docs may be created or deemed unnecessary.
 *
 * @param {IImportDoc} importDoc
 * @returns {IImportStatus} Status string denoting the outcome of import processing.
 */
async function processHistoryImport(importDoc) {
    // Run simplified URL checking logic first
    const fetchPagesWithSameURL = getExistingDocsFetcher(pageDocsSelector)
    const existingPages = await fetchPagesWithSameURL(importDoc)

    // If URL deemed to exist in DB for these doc types, double-check missing visit docs and skip
    if (existingPages.length !== 0) {
        await processExistingDocVisits(existingPages)
        return DOWNLOAD_STATUS.SKIP
    }

    // First create visit docs for all VisitItems associated with this importDoc
    await processNewDocVisits(importDoc)

    // Perform fetch&analysis to fill-out the associated page doc
    await fetchAndAnalyse({ page: await db.get(importDoc.dataDocId) })

    // If we finally got here without an error being thrown, return the success status message
    return DOWNLOAD_STATUS.SUCC
}

/**
 * Handles creating and storing a bookmark doc for a given page doc.
 *
 * @param {IPageDoc} assocPageDoc The page doc to associate with the new bookmark doc. Its `_id` should
 * have been created with nonce set to the bookmark ID from browser bookmark API.
 */
async function processBookmarkData(assocPageDoc) {
    // Grab the nonce from the page _id (in this case should be the bookmark item ID)
    const { nonce: bookmarkId } = convertPageDocId(assocPageDoc._id)

    try {
        // Attempt to fetch BookmarkTreeNode from browser API
        const [bookmarkItem] = await browser.bookmarks.get(bookmarkId)

        // Transform is to a bookmark doc and store it
        await db.put(transformToBookmarkDoc(bookmarkItem, assocPageDoc))
    } catch (err) {
        throw new Error('Cannot fetch bookmark data')
    }
}

async function processBookmarkImport(importDoc) {
    // Run simplified URL checking logic first
    const fetchBookmarksWithSameURL = getExistingDocsFetcher(bookmarkDocsSelector)
    const existingBookmarks = await fetchBookmarksWithSameURL(importDoc)

    // If URL deemed to exist in DB for these doc types, double-check missing visit docs and skip
    if (existingBookmarks.length !== 0) {
        await processExistingDocVisits(existingBookmarks)
        return DOWNLOAD_STATUS.SKIP
    }

    // Create the bookmark doc (TODO: think about if this actually needs to be await'd)
    await processBookmarkData(await db.get(importDoc.dataDocId))

    // Now that bookmark-specific logic is done, continue processing this as a normal history import
    return await processHistoryImport(importDoc)
}

/**
 * Given an import doc, performs appropriate processing depending on the import type.
 *
 * @param {IImportDoc} importDoc The import doc to process.
 * @returns {IImportStatus} Status string denoting the outcome of import processing.
 */
export default async function processImportDoc(importDoc = {}) {
    switch (importDoc.type) {
        case IMPORT_TYPE.HISTORY: return await processHistoryImport(importDoc)
        case IMPORT_TYPE.BOOKMARK: return await processBookmarkImport(importDoc)
        default: throw new Error('Unknown import type')
    }
}
