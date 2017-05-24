// Imports the full browser's history into our database.
// The browser's historyItems and visitItems are quite straightforwardly
// converted to pageDocs and visitDocs (sorry for the confusingly similar name).

import db from 'src/pouchdb'
import { checkWithBlacklist, visitKeyPrefix, convertVisitDocId } from 'src/activity-logger'
import { generatePageDocId, pageDocsSelector } from 'src/page-storage'
import { IMPORT_TYPE, IMPORT_DOC_STATUS } from 'src/options/imports/constants'
import { generateImportDocId, getImportDocs } from './'


const getPendingImports = async fields =>
    await getImportDocs({ status: IMPORT_DOC_STATUS.PENDING, type: IMPORT_TYPE.HISTORY }, fields)

/**
 * Returns a function affording checking of a URL against the URLs of pending import docs.
 */
async function checkWithPendingImports() {
    const { docs: pendingImportDocs } = await getPendingImports(['url'])
    const pendingUrls = pendingImportDocs.map(({ url }) => url)

    return ({ url }) => !pendingUrls.includes(url)
}

// Get the historyItems (visited places/pages; not each visit to them)
async function getHistoryItems({
    startTime = 0,
    endTime,
} = {}) {
    const historyItems = await browser.history.search({
        text: '',
        maxResults: 9999999,
        startTime,
        endTime,
    })
    const isNotBlacklisted = await checkWithBlacklist()
    const isNotPending = await checkWithPendingImports()

    const isWorthRemembering = ({url}) => isNotBlacklisted({url}) && isNotPending({url})
    return historyItems.filter(isWorthRemembering)
}

function transformToImportDoc({pageDoc}) {
    return {
        _id: generateImportDocId({timestamp: Date.now()}),
        status: IMPORT_DOC_STATUS.PENDING,
        type: IMPORT_TYPE.HISTORY,
        url: pageDoc.url,
        dataDocId: pageDoc._id,
    }
}

function transformToPageDoc({historyItem}) {
    const pageDoc = {
        _id: generatePageDocId({
            timestamp: historyItem.lastVisitTime,
            // We set the nonce manually, to prevent duplicating items if
            // importing multiple times (thus making importHistory idempotent).
            nonce: `history-${historyItem.id}`,
        }),
        url: historyItem.url,
        title: historyItem.title,
    }
    return pageDoc
}

// Pulls the full browser history into the database.
export default async function importHistory({
    startTime = 0,
    endTime = Date.now(),
} = {}) {
    // Get the full history: both the historyItems and visitItems.
    console.time('import history')
    const historyItems = await getHistoryItems({startTime, endTime})

    // Convert everything to our data model
    const importTimestamp = Date.now()
    const pageDocs = historyItems.map(historyItem => ({
        ...transformToPageDoc({historyItem}),
        // Mark each doc to remember it originated from this import action.
        importedFromBrowserHistory: importTimestamp,
    }))
    const importDocs = pageDocs.map(pageDoc => transformToImportDoc({pageDoc}))
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
 * Gets count estimates for history imports.
 * @return {any} Object containing `completed` and `remaining` numbers representing the number
 *  of already saved and remaining history items to import, respectively.
 */
export async function getHistoryEstimates({
    startTime = 0,
    endTime = Date.now(),
} = {}) {
    // Grab needed data to make estimate counts
    const historyItems = await getHistoryItems({ startTime, endTime })
    const { docs: pendingPageImportDocs } = await getPendingImports(['_id'])
    const { docs: pageDocs } = await db.find({ selector: pageDocsSelector, fields: ['url'] })

    // Make sure to get remaining count excluding URLs that already are saved in DB
    const savedFullPageCount = pageDocs.length - pendingPageImportDocs.length
    const unsavedAndPageStubCount = historyItems.length + pendingPageImportDocs.length

    return { completed: savedFullPageCount, remaining: unsavedAndPageStubCount }
}
