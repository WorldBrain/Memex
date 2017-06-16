// Imports the full browser's history into our database.
// The browser's historyItems and visitItems are quite straightforwardly
// converted to pageDocs and visitDocs (sorry for the confusingly similar name).

import uniqBy from 'lodash/fp/uniqBy'

import db from 'src/pouchdb'
import { checkWithBlacklist, generateVisitDocId, visitKeyPrefix, convertVisitDocId } from 'src/activity-logger'
import { generatePageDocId, pageDocsSelector } from 'src/page-storage'
import { IMPORT_TYPE } from 'src/options/imports/constants'
import { bookmarkDocsSelector, setImportItems } from './'

const uniqByUrl = uniqBy('url')

/**
 * @returns A function affording checking of a URL against the URLs of existing page docs.
 */
async function checkWithExistingDocs() {
    const existingFullDocs = { ...pageDocsSelector, isStub: { $ne: true } }
    const { docs: existingPageDocs } = await db.find({ selector: existingFullDocs, fields: ['url'] })
    const existingUrls = existingPageDocs.map(({ url }) => url)

    return ({ url }) => !existingUrls.includes(url)
}

// Get the historyItems (visited places/pages; not each visit to them)
const getHistoryItems = async () => filterItemsByUrl(await browser.history.search({
    text: '',
    maxResults: 9999999,
    startTime: 0,
}), IMPORT_TYPE.HISTORY)

const getBookmarkItems = async () =>
    filterItemsByUrl(await browser.bookmarks.getRecent(100000), IMPORT_TYPE.BOOKMARK)

/**
 * Handles performing blacklist and pending import filtering logic on any type
 * of items containing a `url` field.
 *
 * @param {Iterable<any>} items Some Iterable of items of any shape, as long as they contain `url` field.
 * @returns {Iterable<any>} Filtered version of the items arg.
 */
async function filterItemsByUrl(items, type) {
    const isNotBlacklisted = await checkWithBlacklist()
    const doesNotExist = await checkWithExistingDocs()

    const isWorthRemembering = item => isNotBlacklisted(item) && doesNotExist(item)
    return items.filter(isWorthRemembering)
}

/**
 * Binds an import type to a function that transforms a history/bookmark doc to an import item.
 * @param {string} type The IMPORT_TYPE to use.
 */
const transformToImportItem = type => doc => ({ url: doc.url, type })

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
    isStub: true, // Flag denoting that this doc is yet to be filled-out with data from import process
})

/**
 * Converts a browser.history.VisitItem to our visit document model.
 *
 * @param {history.VisitItem} visitItem The VisitItem fetched from browser API.
 * @param {IPageDoc} assocPageDoc The page doc that contains the page data for this visit.
 * @returns {IVisitDoc} Newly created visit doc dervied from visitItem data.
 */
const transformToVisitDoc = assocPageDoc => visitItem => ({
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
    const historyItems = await getHistoryItems()
    const bookmarkItems = await getBookmarkItems()

    // Grab all page stubs for all item types (if they are allowed)
    const importTimestamp = Date.now()
    const genPageStub = item => ({ ...transformToPageDocStub(item), importTimestamp })
    const historyPageStubs = allowTypes[IMPORT_TYPE.HISTORY] ? historyItems.map(genPageStub) : []
    const bookmarkPageStubs = allowTypes[IMPORT_TYPE.BOOKMARK] ? bookmarkItems.map(genPageStub) : []

    // Create import items for all created page stubs
    await setImportItems(uniqByUrl(
        historyPageStubs.map(transformToImportItem(IMPORT_TYPE.HISTORY))
        .concat(bookmarkPageStubs.map(transformToImportItem(IMPORT_TYPE.BOOKMARK)))
    ))

    // Put all page docs together and remove any docs with duplicate URLs
    const pageDocs = uniqByUrl(historyPageStubs.concat(bookmarkPageStubs))

    // Map all page docs to visit docs and store them
    await getVisitsForPageDocs(pageDocs)

    // Store them into the database. Already existing docs will simply be
    // rejected, because their id (timestamp & history id) already exists.
    await db.bulkDocs(pageDocs)
    console.timeEnd('import history')
}

// Get the timestamp of the oldest visit in our database
export async function getOldestVisitTimestamp() {
    const result = await db.allDocs({startkey: visitKeyPrefix, limit: 1})
    return (result.rows.length > 0)
        ? convertVisitDocId(result.rows[0].id).timestamp
        : undefined
}

/**
 * Handles calculating the estimate counts for history and bookmark imports.
 * @returns {any} The state containing import estimates completed and remaining counts.
 */
export async function getEstimateCounts() {
    // Grab needed data from browser API (filtered by whats already in DB)
    const filteredHistoryItems = await getHistoryItems()
    const filteredBookmarkItems = await getBookmarkItems()

    // Grab needed data from DB
    const fields = ['_id']
    const { docs: pageDocs } = await db.find({ selector: { ...pageDocsSelector, isStub: { $ne: true } }, fields })
    const { docs: bookmarkDocs } = await db.find({ selector: bookmarkDocsSelector, fields })

    return {
        completed: {
            [IMPORT_TYPE.HISTORY]: pageDocs.length,
            [IMPORT_TYPE.BOOKMARK]: bookmarkDocs.length,
        },
        remaining: {
            [IMPORT_TYPE.HISTORY]: filteredHistoryItems.length,
            [IMPORT_TYPE.BOOKMARK]: filteredBookmarkItems.length,
        },
    }
}
