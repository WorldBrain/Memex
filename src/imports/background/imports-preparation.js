// Imports the full browser's history into our database.
// The browser's historyItems and visitItems are quite straightforwardly
// converted to pageDocs and visitDocs (sorry for the confusingly similar name).

import uniqBy from 'lodash/fp/uniqBy'

import db from 'src/pouchdb'
import { generateVisitDocId, visitKeyPrefix, convertVisitDocId } from 'src/activity-logger'
import { generatePageDocId } from 'src/page-storage'
import { IMPORT_TYPE } from 'src/options/imports/constants'
import { setImportItems, generateBookmarkDocId, getURLFilteredBookmarkItems, getURLFilteredHistoryItems } from './'
import * as index from 'src/search/search-index'

const uniqByUrl = uniqBy('url')

/**
 * Binds an import type to a function that transforms a history/bookmark doc to an import item.
 * @param {string} type The IMPORT_TYPE to use.
 * @param {any} doc The associated stub doc in the DB to be "filling-out" in batched imports stage.
 */
const transformToImportItem = type => doc => ({ url: doc.url, assocDocId: doc._id, type })

/**
 * Transforms a browser item to a page doc stub. Currently supports browser HistoryItems
 * and BookmarkTreeNodes.
 */
const transformToPageDocStub = item => ({
    _id: generatePageDocId({
        // HistoryItems contain lastVisitTime while BookmarkTreeNodes contain dateAdded
        timestamp: item.lastVisitTime || item.dateAdded,
        // We set the nonce manually, to prevent duplicating items if
        // importing multiple times (thus making importHistory idempotent).
        nonce: item.id,
    }),
    url: item.url,
    title: item.title,
    content: { title: item.title },
    isStub: true, // Flag denoting that this doc is yet to be filled-out with data from import process
})

/**
 * Converts a browser.history.VisitItem to our visit document model.
 *
 * @param {history.VisitItem} visitItem The VisitItem fetched from browser API.
 * @param {IPageDoc} assocPageDoc The page doc that contains the page data for this visit.
 * @returns {IVisitDoc} Newly created visit doc dervied from visitItem data.
 */
export const transformToVisitDoc = assocPageDoc => visitItem => ({
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
export const transformToBookmarkDoc = assocPageDoc => bookmarkItem => ({
    _id: generateBookmarkDocId({
        timestamp: bookmarkItem.dateAdded,
        nonce: bookmarkItem.id,
    }),
    title: bookmarkItem.title,
    url: bookmarkItem.url,
    page: { _id: assocPageDoc._id },
})

/**
 * @param {Array<IPageDoc>} pageDocs Page docs to get visit docs for.
 * @returns {Array<IVisitDoc>} Array of visit docs gotten from URLs in pageDocs arg.
 */
async function getVisitsForPageDocs(pageDocs) {
    // For each page doc, map associated visit items to docs and store them
    for (const pageDoc of pageDocs) {
        const visitItems = await browser.history.getVisits({ url: pageDoc.url })
        // Get on with it if no visits for current URL
        if (!visitItems.length) continue

        const visitDocs = visitItems.map(transformToVisitDoc(pageDoc))
        await db.bulkDocs(visitDocs)
    }
}

/**
 * Prepares everything needed to start the imports batch process. Should create all needed
 * page doc stubs (page docs that are yet to be filled with information from the website
 * the are meant to represent) for browser history and bookmarks, and import docs (used as
 * input and state to the import batcher). A page doc stub should have exactly one import
 * doc created for it, as the import batcher essentially uses those import docs to fill-out
 * the rest of the needed page doc data.
 *
 * @param {any} allowTypes Object containings bools for each valid type of import, denoting whether
 * or not import and page docs should be created for that import type.
 */
export default async function prepareImports(allowTypes = {}) {
    console.time('import history')
    const historyItems = await getURLFilteredHistoryItems()
    const bookmarkItems = await getURLFilteredBookmarkItems()

    // Grab all page stubs for all item types (if they are allowed)
    const importTimestamp = Date.now()
    const genPageStub = item => ({ ...transformToPageDocStub(item), importTimestamp })
    const historyPageStubs = allowTypes[IMPORT_TYPE.HISTORY] ? historyItems.map(genPageStub) : []
    const bookmarkPageStubs = allowTypes[IMPORT_TYPE.BOOKMARK] ? bookmarkItems.map(genPageStub) : []

    // Map bookmark page stubs to bookmark items, if specified
    const bookmarkDocs = bookmarkPageStubs.map((stub, i) => transformToBookmarkDoc(stub)(bookmarkItems[i]))

    // Create import items for all created page stubs
    await setImportItems(uniqByUrl(
        historyPageStubs.map(transformToImportItem(IMPORT_TYPE.HISTORY))
            .concat(bookmarkPageStubs.map(transformToImportItem(IMPORT_TYPE.BOOKMARK)))
    ))

    // Put all page docs together and remove any docs with duplicate URLs
    const pageDocs = uniqByUrl(historyPageStubs.concat(bookmarkPageStubs))

    // Map all page docs to visit docs and store them
    await getVisitsForPageDocs(pageDocs)

    const allDocs = pageDocs.concat(bookmarkDocs)

    // Queue them for index insertion
    console.time('add-to-index time')
    index.add(allDocs)
        .then(() => {
            console.timeEnd('add-to-index time')
            console.log('done adding new docs to index')
        })
        .catch(console.error)

    // Store them into the database. Already existing docs will simply be
    // rejected, because their id (timestamp & history id) already exists.
    await db.bulkDocs(allDocs)
    console.timeEnd('import history')
}

// Get the timestamp of the oldest visit in our database
export async function getOldestVisitTimestamp() {
    const result = await db.allDocs({startkey: visitKeyPrefix, limit: 1})
    return (result.rows.length > 0)
        ? convertVisitDocId(result.rows[0].id).timestamp
        : undefined
}
