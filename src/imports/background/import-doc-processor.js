import flatten from 'lodash/flatten'

import db from 'src/pouchdb'
import { fetchPageData } from 'src/page-analysis/background'
import { generateVisitDocId, visitDocsSelector } from 'src/activity-logger'
import { pageDocsSelector } from 'src/page-storage'
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
 * @param {history.VisitItem} visitItem The VisitItem fetched from browser API.
 * @param {any} assocDoc The associated DB doc containing `url` and `_id` to associate with newly created visit doc.
 * @returns {IVisitDoc} Newly created visit doc dervied from visitItem data for insertion into DB.
 */
const transformToVisitDoc = (visitItem, { _id, url }) => ({
    _id: generateVisitDocId({
        timestamp: visitItem.visitTime,
        // We set the nonce manually, to prevent duplicating items if
        // importing multiple times (thus making importHistory idempotent).
        nonce: `history-${visitItem.visitId}`,
    }),
    visitStart: visitItem.visitTime,
    browserId: visitItem.visitId,
    referringVisitItemId: visitItem.referringVisitId,
    url,
    page: { _id },
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
        const { docs: visitDocs } = await db.find({ selector: { ...visitDocsSelector, url }, fields: ['browserId'] })
        const visitItems = await browser.history.getVisits({ url })

        // Project out stored browser IDs from existing visit docs for easy comparison
        const savedVisitIds = visitDocs.map(doc => doc.browserId)

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
 * Runs all the fetch and analysis logic for the page doc pointed to by
 * the import doc. Depending on the outcome of that logic, will update the
 * stub with all the new data.
 *
 * @param {IImportDoc} importDoc The import doc to be processed.
 */
async function processNewPageDoc({ url, dataDocId: pageStubId }) {
    // Attempt the data fetch
    const { text, metadata, favIcon } = await fetchPageData({ url })

    // Update the page stub with this data
    const pageDoc = await db.get(pageStubId)
    await db.put({
        ...pageDoc,
        extractedText: text,
        extractedMetadata: metadata,
        favIcon, // TODO: Move this to attachments thing (want to do at page-analysis level later)
    })
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

    // Fill-out the page doc
    await processNewPageDoc(importDoc)

    // If we finally got here without an error being thrown, return the success status message
    return DOWNLOAD_STATUS.SUCC
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
        default: throw new Error('Unknown import type')
    }
}
