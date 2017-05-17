// Imports the full browser's history into our database.
// The browser's historyItems and visitItems are quite straightforwardly
// converted to pageDocs and visitDocs (sorry for the confusingly similar name).

import db from 'src/pouchdb'
import docuri from 'docuri'
import randomString from 'src/util/random-string'
import { checkWithBlacklist, generateVisitDocId,
         visitKeyPrefix, convertVisitDocId } from 'src/activity-logger'
import { generatePageDocId } from 'src/page-storage'

export const importKeyPrefix = 'import/'
export const importDocsSelector = { _id: { $gte: importKeyPrefix, $lte: `${importKeyPrefix}\uffff` } }

export const convertImportDocId = docuri.route(`${importKeyPrefix}:timestamp/:nonce`)

export function generateImportDocId({timestamp, nonce} = {}) {
    const date = timestamp ? new Date(timestamp) : new Date()
    return convertImportDocId({
        timestamp: date.getTime(),
        nonce: nonce || randomString(),
    })
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
    const isWorthRemembering = await checkWithBlacklist()
    return historyItems.filter(({url}) => isWorthRemembering({url}))
}

function transformToImportDoc({pageDoc}) {
    return {
        _id: generateImportDocId({timestamp: Date.now()}),
        status: 'pending',
        type: 'history',
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

function transformToVisitDoc({visitItem, pageDoc}) {
    return {
        _id: generateVisitDocId({
            timestamp: visitItem.visitTime,
            // We set the nonce manually, to prevent duplicating items if
            // importing multiple times (thus making importHistory idempotent).
            nonce: `history-${visitItem.visitId}`,
        }),
        visitStart: visitItem.visitTime,
        // Temporarily keep the pointer to the browser history's id numbering.
        // Will be replaced by the id of the corresponding visit in our model.
        referringVisitItemId: visitItem.referringVisitId,
        url: pageDoc.url,
        page: {
            _id: pageDoc._id,
        },
    }
}

// Convert data from the browser's history to our data model.
// Returns two arrays: pageDocs and visitDocs.
function convertHistoryToPagesAndVisits({
    historyItems,
    visitItemsPerHistoryItem,
}) {
    const pageDocs = []
    const visitDocs = {}
    historyItems.forEach((historyItem, i) => {
        // Read the visitItems corresponding to this historyItem
        const visitItems = visitItemsPerHistoryItem[i]
        // Map each pair to a page...
        const pageDoc = transformToPageDoc({historyItem})
        pageDocs.push(pageDoc)
        // ...and one or more visits to that page.
        visitItems.forEach(visitItem => {
            const visitDoc = transformToVisitDoc({visitItem, pageDoc})
            visitDocs[visitItem.visitId] = visitDoc
        })
    })
    // Now each new visit has an id, we can map the referrer-paths between them.
    Object.values(visitDocs).forEach(visitDoc => {
        // Take and forget the id of the visitItem in the browser's history.
        const referringVisitItemId = visitDoc.referringVisitItemId
        delete visitDoc.referringVisitItemId
        if (referringVisitItemId && referringVisitItemId !== '0') {
            // Look up what visit this id maps to in our model.
            const referringVisitDoc = visitDocs[referringVisitItemId]
            if (referringVisitDoc) {
                const referringVisitDocId = referringVisitDoc._id
                // Add a reference to the visit document.
                visitDoc.referringVisit = {_id: referringVisitDocId}
            } else {
                // Apparently the referring visit is not present in the history.
                // We can just pretend that there was no referrer.
            }
        }
    })
    // Return the new docs.
    return {
        pageDocs,
        visitDocs: Object.values(visitDocs), // we can forget the old ids now
    }
}

// Pulls the full browser history into the database.
export default async function importHistory({
    startTime = 0,
    endTime = Date.now(),
} = {}) {
    // Get the full history: both the historyItems and visitItems.
    console.time('import history')
    const historyItems = await getHistoryItems({startTime, endTime})
    // Get all visits to each of those items.
    const visitItemsPs = historyItems.map(async historyItem =>
        await browser.history.getVisits({url: historyItem.url})
    )
    const visitItemsPerHistoryItem = await Promise.all(visitItemsPs)
    // Convert everything to our data model
    const {pageDocs, visitDocs} = convertHistoryToPagesAndVisits({
        historyItems,
        visitItemsPerHistoryItem,
    })
    const importDocs = pageDocs.map(pageDoc => transformToImportDoc({pageDoc}))
    let allDocs = pageDocs.concat(visitDocs)
    // Mark each doc to remember it originated from this import action.
    const importTimestamp = Date.now()
    allDocs = allDocs.map(doc => ({
        ...doc,
        importedFromBrowserHistory: importTimestamp,
    }))
    allDocs = allDocs.concat(importDocs)
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

// Get the number of importable items in the history
export async function getHistoryStats() {
    const historyItems = await getHistoryItems()
    return {
        quantity: historyItems.length,
    }
}
