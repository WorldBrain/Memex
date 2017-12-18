import noop from 'lodash/fp/noop'

import db from 'src/pouchdb'
import {
    IMPORT_TYPE as TYPE,
    OLD_EXT_KEYS,
} from 'src/options/imports/constants'
import { differMaps } from 'src/util/map-set-helpers'
import { pageKeyPrefix } from 'src/page-storage'
import { bookmarkKeyPrefix } from 'src/bookmarks'
import createImportItems from './import-item-creation'

/**
 * Object with keys for each import item type and corresponding unsigned int values,
 * representing the estimates count for that particular type.
 *
 * @typedef {Object} ItemTypeCount
 * @property {number} h
 * @property {number} o
 * @property {number} b
 */

/**
 * @typedef {Object} EstimateCounts
 * @property {ItemTypeCount} remaining
 * @property {ItemTypeCount} completed
 */

class ImportEstimatesManager {
    static ESTIMATES_STORAGE_KEY = 'import-estimate-counts'
    static DAY_IN_MS = 1000 * 60 * 60 * 24
    static initCount = () => ({
        [TYPE.HISTORY]: 0,
        [TYPE.BOOKMARK]: 0,
        [TYPE.OLD]: 0,
    })

    /**
     * @property {ItemTypeCount}
     */
    completed

    /**
     * @property {ItemTypeCount}
     */
    remaining

    /**
     * @property {number} MS since epoch representing time since last calculation.
     */
    calculatedAt

    constructor() {
        this.initCounts()
    }

    /**
     * @returns {EstimateCounts}
     */
    get counts() {
        return {
            completed: this.completed,
            remaining: this.remaining,
        }
    }

    /**
     * @param {EstimateCounts} args.completed
     * @param {EstimateCounts} args.remaining
     */
    set counts({ completed, remaining }) {
        this.completed = completed
        this.remaining = remaining
    }

    initCounts() {
        this.counts = {
            completed: ImportEstimatesManager.initCount(),
            remaining: ImportEstimatesManager.initCount(),
        }
    }

    /**
     * Handles calculating the completed estimate counts for history, bookmark, and old-ext imports.
     */
    async calcCompletedCounts() {
        // Grab existing data counts from DB
        const { rows: { length: numPageDocs } } = await db.allDocs({
            startkey: pageKeyPrefix,
            endkey: `${pageKeyPrefix}\uffff`,
        })
        const { rows: { length: numBmDocs } } = await db.allDocs({
            startkey: bookmarkKeyPrefix,
            endkey: `${bookmarkKeyPrefix}\uffff`,
        })
        const {
            [OLD_EXT_KEYS.NUM_DONE]: numOldExtDone,
        } = await browser.storage.local.get({ [OLD_EXT_KEYS.NUM_DONE]: 0 })

        // Can sometimes return slightly different lengths for unknown reason
        const completedHistory = numPageDocs - numBmDocs

        this.completed = {
            [TYPE.HISTORY]: completedHistory < 0 ? 0 : completedHistory,
            [TYPE.BOOKMARK]: numBmDocs,
            [TYPE.OLD]: numOldExtDone,
        }
    }

    /**
     * Handles calculating the remaining estimate counts for history, bookmark, and old-ext imports.
     */
    async calcRemainingCounts(handleItemCreation) {
        let bookmarkItems

        // Import items creation will yield parts of the total items
        for await (let { data, type } of createImportItems()) {
            if (type === TYPE.BOOKMARK) {
                // Bookmarks should always yield before history
                bookmarkItems = data
            } else if (type === TYPE.HISTORY) {
                // Don't include pages in history that exist as bookmarks as well
                data = differMaps(bookmarkItems)(data)
            }

            this.remaining[type] += data.size
            await handleItemCreation({ data, type })
        }
    }

    async updateLocalState() {
        const storage = await browser.storage.local.get({
            [ImportEstimatesManager.ESTIMATES_STORAGE_KEY]: {
                calculatedAt: 0,
                completed: {},
                remaining: {},
            },
        })

        const { calculatedAt, ...ests } = storage[
            ImportEstimatesManager.ESTIMATES_STORAGE_KEY
        ]

        // Set local state
        this.counts = ests
        this.calculatedAt = calculatedAt
    }

    /**
     * Sets persisted state to current local state.
    */
    async persist() {
        return await browser.storage.local.set({
            [ImportEstimatesManager.ESTIMATES_STORAGE_KEY]: {
                ...this.counts,
                calculatedAt: this.calculatedAt,
            },
        })
    }

    /**
     * Set last calc'd at beginning of time to force cache-miss next `fetchCached` method call.
    */
    async dirty() {
        this.calculatedAt = 0
        return await this.persist()
    }

    /**
     * Re-run local est calculations and persist them.
     */
    async recalcState(onItemCreation) {
        this.initCounts()
        this.calculatedAt = Date.now() // Update timestamp

        // Perform calcs
        await this.calcRemainingCounts(onItemCreation)
        await this.calcCompletedCounts()

        await this.persist() // Sync with persisted state
    }

    /**
     * Attempts to fetch cached estimate counts for import items. Cache hit will miss if < 1 day since
     * last calculation.
     *
     * @param {boolean} [forceRecalc=false] Flag to denote whether to force the recalc against sources.
     * @param {(data: any) => Promise<void>} [args.onItemCreation=noop] Async CB taking object containing created import
     *  item data received in the process of estimating counts - these are useful data to avoid recalcing for
     *  import items state.
     */
    async fetchCached({ forceRecalc = false, onItemCreation = noop }) {
        // First sync local state with persisted
        await this.updateLocalState()

        // If saved calcs are old, or forced to, recalc
        if (
            forceRecalc ||
            this.calculatedAt < Date.now() - ImportEstimatesManager.DAY_IN_MS
        ) {
            await this.recalcState(onItemCreation)
        }

        return this.counts
    }
}

const estimateManager = new ImportEstimatesManager()

export default estimateManager
