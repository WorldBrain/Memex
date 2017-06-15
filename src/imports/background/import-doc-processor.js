import db from 'src/pouchdb'
import { analysePageForImports as fetchAndAnalyse } from 'src/page-analysis/background'
import { convertPageDocId, pageDocsSelector } from 'src/page-storage'
import { bookmarkDocsSelector, generateBookmarkDocId } from './'
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
 * Handles processing of a history-type import item. Checks for exisitng page docs that have the same URL.
 *
 * @param {IImportItem} importItemDoc
 * @returns {IImportStatus} Status string denoting the outcome of import processing.
 */
async function processHistoryImport(importItem) {
    // Run simplified URL checking logic first
    const fetchPagesWithSameURL = getExistingDocsFetcher(pageDocsSelector)
    const existingPages = await fetchPagesWithSameURL(importItem)

    // If URL deemed to exist in DB for these doc types, skip it
    if (existingPages.length !== 0) {
        return DOWNLOAD_STATUS.SKIP
    }

    // Perform fetch&analysis to fill-out the associated page doc
    await fetchAndAnalyse({ page: await getAssociatedPageStub(importItem) })

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

async function processBookmarkImport(importItem) {
    // Run simplified URL checking logic first
    const fetchBookmarksWithSameURL = getExistingDocsFetcher(bookmarkDocsSelector)
    const existingBookmarks = await fetchBookmarksWithSameURL(importItem)

    // If URL deemed to exist in DB for these doc types, skip it
    if (existingBookmarks.length !== 0) {
        return DOWNLOAD_STATUS.SKIP
    }

    // Create the bookmark doc (TODO: think about if this actually needs to be await'd)
    await processBookmarkData(await getAssociatedPageStub(importItem))

    // Now that bookmark-specific logic is done, continue processing this as a normal history import
    return await processHistoryImport(importItem)
}

/**
 * Given an import state item, performs appropriate processing depending on the import type.
 *
 * @param {IImportItem} importItem The import state item to process.
 * @returns {IImportStatus} Status string denoting the outcome of import processing.
 */
export default async function processImportItem(importItem = {}) {
    switch (importItem.type) {
        case IMPORT_TYPE.HISTORY: return await processHistoryImport(importItem)
        case IMPORT_TYPE.BOOKMARK: return await processBookmarkImport(importItem)
        default: throw new Error('Unknown import type')
    }
}
