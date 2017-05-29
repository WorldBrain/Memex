// Imports the full browser's history into our database.
// The browser's historyItems and visitItems are quite straightforwardly
// converted to pageDocs and visitDocs (sorry for the confusingly similar name).

import uniqBy from 'lodash/uniqBy'

import db from 'src/pouchdb'
import { checkWithBlacklist, visitKeyPrefix, convertVisitDocId } from 'src/activity-logger'
import { generatePageDocId, pageDocsSelector } from 'src/page-storage'
import { IMPORT_TYPE, IMPORT_DOC_STATUS } from 'src/options/imports/constants'
import { generateImportDocId, getImportDocs, bookmarkDocsSelector } from './'


const getPendingImports = async (fields, type) =>
    await getImportDocs({ status: IMPORT_DOC_STATUS.PENDING, type }, fields)

/**
 * @returns A function affording checking of a URL against the URLs of pending import docs.
 */
async function checkWithPendingImports(type) {
    const { docs: pendingImportDocs } = await getPendingImports(['url'], type)
    const pendingUrls = pendingImportDocs.map(({ url }) => url)

    return ({ url }) => !pendingUrls.includes(url)
}

/**
 * @returns A function affording checking of a URL against the URLs of existing page docs.
 */
async function checkWithExistingDocs() {
    const { docs: existingPageDocs } = await db.find({ selector: { ...pageDocsSelector }, fields: ['url'] })
    const existingUrls = existingPageDocs.map(({ url }) => url)

    return ({ url }) => !existingUrls.includes(url)
}

// Get the historyItems (visited places/pages; not each visit to them)
const getHistoryItems = async ({
    startTime = 0,
    endTime = Date.now(),
} = {}) => filterItemsByUrl(await browser.history.search({
    text: '',
    maxResults: 9999999,
    startTime,
    endTime,
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
    const isNotPending = await checkWithPendingImports(type)
    const doesNotExist = await checkWithExistingDocs()

    const isWorthRemembering = item => isNotBlacklisted(item) && isNotPending(item) && doesNotExist(item)
    return items.filter(isWorthRemembering)
}

/**
 * Binds an import type to a function that transforms a page doc to an import doc.
 * @param {string} type The IMPORT_TYPE to use.
 */
const transformToImportDoc = (type, timestamp = Date.now()) => pageDoc => ({
    _id: generateImportDocId({
        timestamp,
        nonce: pageDoc.url,
    }),
    status: IMPORT_DOC_STATUS.PENDING,
    url: pageDoc.url,
    dataDocId: pageDoc._id,
    type,
})

/**
 * Transforms a browser item to a page doc. Currently supports browser HistoryItems
 * and BookmarkTreeNodes.
 */
const transformToPageDoc = item => ({
    _id: generatePageDocId({
        // HistoryItems contain lastVisitTime while BookmarkTreeNodes contain dateAdded
        timestamp: item.lastVisitTime || item.dateAdded,
        // We set the nonce manually, to prevent duplicating items if
        // importing multiple times (thus making importHistory idempotent).
        nonce: item.id,
    }),
    url: item.url,
    title: item.title,
})

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
 * @param {any} historyOpts Object containing `startTime` and `endTime` numbers representing ms to search
 * and process browser history from and until, respectively.
 */
export default async function prepareImports({
    allowTypes = {},
    historyOptions = {},
}) {
    console.time('import history')
    const historyItems = await getHistoryItems(historyOptions)
    const bookmarkItems = await getBookmarkItems()

    // Grab all page stubs for all item types (if they are allowed)
    const importTimestamp = Date.now()
    const genPageStub = item => ({ ...transformToPageDoc(item), importTimestamp })
    const historyPageStubs = allowTypes[IMPORT_TYPE.HISTORY] ? historyItems.map(genPageStub) : []
    const bookmarkPageStubs = allowTypes[IMPORT_TYPE.BOOKMARK] ? bookmarkItems.map(genPageStub) : []

    // Create import docs for all created page stubs
    const importDocs = historyPageStubs.map(transformToImportDoc(IMPORT_TYPE.HISTORY, importTimestamp))
        .concat(bookmarkPageStubs.map(transformToImportDoc(IMPORT_TYPE.BOOKMARK, importTimestamp)))

    // Put all page docs together and remove any docs with duplicate URLs
    const pageDocs = uniqBy(historyPageStubs.concat(bookmarkPageStubs), 'url')

    const allDocs = pageDocs.concat(importDocs)

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

/**
 * Handles calculating the estimate counts for history and bookmark imports.
 * @returns {any} The state containing import estimates completed and remaining counts.
 */
export async function getEstimateCounts({
    startTime = 0,
    endTime = Date.now(),
}) {
    // Grab needed data from browser API
    const historyItems = await getHistoryItems({ startTime, endTime })
    const bookmarkItems = await getBookmarkItems()

    // Grab needed data from DB
    const { docs: pageDocs } = await db.find({ selector: pageDocsSelector, fields: ['_id'] })
    const { docs: bookmarkDocs } = await db.find({ selector: bookmarkDocsSelector, fields: ['_id'] })
    const { docs: pendingImportDocs } = await getPendingImports(['type'])

    // Less constants than two filter calls
    const pendingCounts = { [IMPORT_TYPE.BOOKMARK]: 0, [IMPORT_TYPE.HISTORY]: 0 }
    pendingImportDocs.forEach(doc => ++pendingCounts[doc.type])

    return {
        completed: {
            [IMPORT_TYPE.HISTORY]: pageDocs.length - pendingCounts[IMPORT_TYPE.HISTORY],
            [IMPORT_TYPE.BOOKMARK]: bookmarkDocs.length,
        },
        remaining: {
            [IMPORT_TYPE.HISTORY]: historyItems.length + pendingCounts[IMPORT_TYPE.HISTORY],
            [IMPORT_TYPE.BOOKMARK]: (bookmarkItems.length - bookmarkDocs.length) + pendingCounts[IMPORT_TYPE.BOOKMARK],
        },
    }
}
