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
import { clearOldExtData } from 'src/imports/background'

const fetchPageDataOpts = {
    includePageContent: true,
    includeFavIcon: true,
}

/**
 * TransitionType strings that we care about in the context of the ext.
 */
const wantedTransitionTypes = new Set([
    'link',
    'generated',
    'keyword',
    'keyword_generated',
    'typed',
    'auto_bookmark',
    'manual_subframe',
    'reload',
    'auto_toplevel',
])

/**
 * @param {history.VisitItem} item VisitItem object received from the WebExt History API.
 * @returns {boolean}
 */
const filterVisitItemByTransType = item =>
    wantedTransitionTypes.has(item.transition)

/**
 * @param {IImportItem} importItem
 * @throws {Error} Allows short-circuiting of the import process for current item if no VisitItems left after
 *  filtering.
 */
async function checkVisitItemTransitionTypes({ url }) {
    const visitItems = await browser.history.getVisits({ url })

    // Only keep VisitItems with wanted TransitionType
    const filteredVisitItems = visitItems.filter(filterVisitItemByTransType)

    // Throw if no VisitItems left post-filtering (only if there was items to begin with)
    if (visitItems.length > 0 && filteredVisitItems.length === 0) {
        throw new Error('Unused TransitionType')
    }
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
 * Create visit docs from each of the WebExt history API's VisitItems. VisitItems with
 * TransitionTypes not wanted in the context of the extension will be ignored. More info:
 *  - https://developer.chrome.com/extensions/history#transition_types
 *
 * @param {PageDoc} pageDoc Page doc to get visits and create visit docs for.
 * @returns {Array<IVisitDoc>} Array of visit docs gotten from URLs in `pageDoc`.
 */
async function createAssociatedVisitDocs(pageDoc) {
    const visitItems = await browser.history.getVisits({ url: pageDoc.url })

    return visitItems
        .filter(filterVisitItemByTransType)
        .map(transformToVisitDoc(pageDoc))
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
    await checkVisitItemTransitionTypes(importItem)

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

    // If all okay now, remove the old data
    await clearOldExtData(importItem)

    return { status: DOWNLOAD_STATUS.SUCC }
}

/**
 * Given an import state item, performs appropriate processing depending on the import type.
 *
 * @param {IImportItem} importItem Import item state item to process.
 * @param {any} token Token object to allow attaching of rejection callback, affording caller Promise cancellation.
 * @returns {Promise<any>} Resolves to a status string denoting the outcome of import processing as `status`.
 *  Rejects for any other error, including bad content check errors, and cancellation - caller should handle.
 */
const processImportItem = (importItem = {}, token) =>
    new Promise(async (resolve, reject) => {
        // Bind the reject callback to token to allow outside cancellation of `this` Promise
        token.cancel = reject

        try {
            let result
            switch (importItem.type) {
                case IMPORT_TYPE.BOOKMARK:
                case IMPORT_TYPE.HISTORY:
                    result = await processHistoryImport(importItem)
                    break
                case IMPORT_TYPE.OLD:
                    result = await processOldExtImport(importItem)
                    break
                default:
                    throw new Error('Unknown import type')
            }

            return resolve(result)
        } catch (err) {
            return reject(err)
        }
    })

export default processImportItem
