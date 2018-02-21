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

export default class ImportItemProcessor {
    /**
     * @property {Function} Function to afford aborting current XHR. Set when import processor reaches XHR point.
     */
    abortXHR

    /**
     * @property {boolean} Flag denoting whether or not execution has been cancelled.
     */
    cancelled = false

    /**
     * @property {boolean} Flag denoting whether or not execution has finished successfully or not.
     */
    finished = false

    static makeInterruptedErr() {
        const err = new Error('Execution interrupted')
        err.cancelled = true
        return err
    }

    /**
     * Hacky way of enabling cancellation. Checks state and throws an Error if detected change.
     * Should be called by any main execution methods before any expensive async logic run.
     *
     * TODO: May move this to token-based later - need to come up with a clean way.
     *
     * @throws {Error} If `this.cancelled` is set.
     */
    _checkCancelled() {
        if (this.cancelled) {
            throw ImportItemProcessor.makeInterruptedErr()
        }
    }

    async _storeDocs({ pageDoc, bookmarkDocs = [], visitDocs = [] }) {
        this._checkCancelled()

        return await Promise.all([
            index.addPage({
                pageDoc,
                visits: visitDocs.map(doc => doc.visitStart),
                bookmarkDocs,
            }),
            db.bulkDocs([pageDoc, ...bookmarkDocs, ...visitDocs]),
        ])
    }

    /**
     * Using the `url` of the current item, performs the XHR and formatting needed on the response
     * to form a new page doc.
     *
     * @param {IImportItem} importItem
     * @returns {PageDoc}
     */
    async _createPageDoc({ url }) {
        // Do the page data fetch
        const fetch = fetchPageData({
            url,
            opts: fetchPageDataOpts,
        })

        this.abortXHR = fetch.cancel

        this._checkCancelled()
        const { content, favIconURI } = await fetch.run()

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

    /**
     * Handles processing of a history-type import item. Checks for exisitng page docs that have the same URL.
     *
     * @param {IImportItem} importItemDoc
     * @returns {any} Status string denoting the outcome of import processing as `status`
     *  + optional filled-out page doc as `pageDoc` field.
     */
    async _processHistory(importItem) {
        await checkVisitItemTransitionTypes(importItem)

        const pageDoc = await this._createPageDoc(importItem)

        // Fetch and create meta-docs
        const visitDocs = await createAssociatedVisitDocs(pageDoc)
        const bookmarkDocs = []

        if (importItem.type === IMPORT_TYPE.BOOKMARK) {
            bookmarkDocs.push(
                await createAssociatedBookmarkDoc(pageDoc, importItem),
            )
        }

        await this._storeDocs({ pageDoc, visitDocs, bookmarkDocs })

        this._checkCancelled()
        // If we finally got here without an error being thrown, return the success status message + pageDoc data
        return { status: DOWNLOAD_STATUS.SUCC }
    }

    async _processOldExt(importItem) {
        const pageDoc = await this._createPageDoc(importItem)

        // Fetch and create meta-docs
        const visitDocs = await createAssociatedVisitDocs(pageDoc)
        const bookmarkDocs = []

        if (importItem.hasBookmark) {
            bookmarkDocs.push(
                transformToMinimalBookmarkDoc(pageDoc)(importItem),
            )
        } else {
            visitDocs.push(transformToMinimalVisitDoc(pageDoc)(importItem))
        }

        await this._storeDocs({ pageDoc, visitDocs, bookmarkDocs })

        // If all okay now, remove the old data
        await clearOldExtData(importItem)

        this._checkCancelled()

        // If we finally got here without an error being thrown, return the success status message + pageDoc data
        return { status: DOWNLOAD_STATUS.SUCC }
    }

    /**
     * Given an import state item, performs appropriate processing depending on the import type.
     * Main execution method.
     *
     * @param {IImportItem} importItem Import item state item to process.
     * @returns {Promise<any>} Resolves to a status string denoting the outcome of import processing as `status`.
     *  Rejects for any other error, including bad content check errors, and cancellation - caller should handle.
     */
    async process(importItem) {
        this._checkCancelled()

        switch (importItem.type) {
            case IMPORT_TYPE.BOOKMARK:
            case IMPORT_TYPE.HISTORY:
                return await this._processHistory(importItem)
            case IMPORT_TYPE.OLD:
                return await this._processOldExt(importItem)
            default:
                throw new Error('Unknown import type')
        }
    }

    /**
     * Aborts execution. Note that once called, exeuction will only actually stop when the main
     * methods reach a `this._checkCancelled()` call.
     */
    cancel() {
        if (typeof this.abortXHR === 'function') {
            this.abortXHR()
        }
        this.cancelled = true
    }
}
