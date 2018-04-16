import { IMPORT_TYPE as TYPE } from 'src/options/imports/constants'
import { NUM_IMPORT_ITEMS as ONBOARDING_LIM } from 'src/overview/onboarding/constants'
import ItemCreator from './item-creator'
import ImportCache from './cache'

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

export class ImportStateManager {
    static QUICK_MODE_ITEM_LIMITS = { histLimit: ONBOARDING_LIM, bmLimit: 0 }

    static DEF_ALLOW_TYPES = {
        [TYPE.HISTORY]: true,
        [TYPE.BOOKMARK]: true,
    }

    _includeErrs = false

    /**
     * @type {any} Object containing boolean flags for each import item type key, representing whether
     *  or not that type should be saved to state (user configurable via UI import-type checkboxes).
     */
    allowTypes = ImportStateManager.DEF_ALLOW_TYPES

    /**
     * @type {ItemTypeCount}
     */
    completed

    /**
     * @type {ItemTypeCount}
     */
    remaining

    /**
     * @param {ImportCache} [cacheBackend] Affords state persistence.
     */
    constructor({
        cacheBackend = new ImportCache({}),
        itemCreator = new ItemCreator({}),
    }) {
        this._cache = cacheBackend
        this._itemCreator = itemCreator

        this._initFromCache()
    }

    /**
     * @returns {EstimateCounts}
     */
    get counts() {
        return {
            completed: { ...this.completed },
            remaining: { ...this.remaining },
        }
    }

    /**
     * @param {EstimateCounts} ests
     */
    set counts({ completed, remaining }) {
        this.completed = { ...completed }
        this.remaining = { ...remaining }
    }

    async _initFromCache() {
        await this._cache.ready

        this.counts = this._cache.counts
    }

    /**
     * @param {ImportItem} importItem
     * @param {boolean} isError
     */
    _markOffItem({ type }, isError) {
        this.remaining[type] -= 1

        if (!isError) {
            this.completed[type] += 1
        }
    }

    /**
     * These counts are available via the item creator instance.
     */
    async _calcCompletedCounts() {
        this.completed = {
            [TYPE.HISTORY]: this._itemCreator.completedHistCount,
            [TYPE.BOOKMARK]: this._itemCreator.completedBmCount,
        }
    }

    /**
     * Handles calculating the remaining estimate counts for history, bookmark, and old-ext imports.
     */
    async _calcRemainingCounts() {
        let bookmarkIds = new Set()

        // Import items creation will yield parts of the total items
        for await (let {
            data,
            type,
        } of this._itemCreator.createImportItems()) {
            if (type === TYPE.BOOKMARK) {
                // Bookmarks should always yield before history
                bookmarkIds = new Set([...bookmarkIds, ...data.keys()])
            } else if (type === TYPE.HISTORY) {
                // Don't include pages in history that exist as bookmarks as well
                data = new Map(
                    [...data].filter(([key]) => !bookmarkIds.has(key)),
                )
            }

            // Cache current processed chunk for checking against future chunks (count state change happens in here)
            const numAdded = await this._cache.persistItems(
                data,
                type,
                this._includeErrs,
            )
            this.remaining[type] += numAdded // Inc count state
        }
    }

    /**
     * Main count calculation method which will create import items, and set state counts and item chunks.
     */
    async _calcCounts() {
        await this.clearItems() // Reset current counts

        // Create new ImportItemCreator to create import items from which we derive counts
        await this._itemCreator.initData()

        await this._calcCompletedCounts()
        await this._calcRemainingCounts()
    }

    /**
     * Forces the persisted estimates state to be "dirtied", meaning next `fetchEsts` attempt will
     * require a complete recalc rather than using the persisted state/cache.
     */
    dirtyEsts() {
        this._cache.expired = true
    }

    /**
     * Attempts to fetch the estimate counts from local state or does a complete state recalculation
     * if it deems current state to be out-of-date.
     *
     * @param {boolean} [quick=false] Determines if quick mode is set (only limited recent history).
     * @param {boolean} [includeErrs=false]
     * @return {EstimateCounts}
     */
    async fetchEsts(quick = false, includeErrs = false) {
        this._itemCreator.limits = quick
            ? ImportStateManager.QUICK_MODE_ITEM_LIMITS
            : {}

        if (this._cache.expired) {
            this._includeErrs = includeErrs
            // Perform calcs to update state
            await this._calcCounts()
            await this._cache.persistEsts(this.counts)

            // Expire cache immediately if quick mode (next read attempt will recalc)
            if (quick) this._cache.expired = true
        }

        return this.counts
    }

    /**
     * @generator
     * @param {boolean} [includeErrs=true] Flag to decide whether to include error'd items in the Iterator.
     * @yields {any} Object containing `chunkKey` and `chunk` pair, corresponding to the chunk storage key
     *  and value at that storage key, respectively.
     */
    async *fetchItems(includeErrs = false) {
        yield* this._cache.getItems(includeErrs)
    }

    /**
     * Removes a single import item from its stored chunk.
     *
     * @param {string} chunkKey Storage key of chunk in which item wanted to remove exists.
     * @param {string} itemKey Key within chunk pointing item to remove.
     * @returns {ImportItem} The removed import item.
     */
    async removeItem(chunkKey, itemKey, isError = false) {
        const item = await this._cache.removeItem(chunkKey, itemKey)

        // Decrement remaining items count
        if (item != null) {
            this._markOffItem(item, isError)
        }

        return item
    }

    /**
     * Moves a single import item from its stored chunk to an error chunk.
     *
     * @param {string} chunkKey Storage key of chunk in which item wanted to flag exists.
     * @param {string} itemKey Key within chunk pointing item to flag.
     */
    async flagItemAsError(chunkKey, itemKey) {
        const item = await this.removeItem(chunkKey, itemKey, true)
        await this._cache.flagItemAsError(itemKey, item)
    }

    async clearItems() {
        this.counts = ImportCache.INIT_ESTS
        await this._cache.clear()
    }
}

const instance = new ImportStateManager({})

export default instance
