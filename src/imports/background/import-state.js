import keys from 'lodash/fp/keys'

import {
    IMPORT_TYPE as TYPE,
    OLD_EXT_KEYS,
    STORAGE_KEYS,
} from 'src/options/imports/constants'
import { mapToObject } from 'src/util/map-set-helpers'
import ItemCreator from './import-item-creation'

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
    static ESTS_STORAGE_KEY = 'import-estimate-counts'
    static DAY_IN_MS = 1000 * 60 * 60 * 24
    static STATE_STORAGE_KEY = 'import-items-state'
    static ERR_STATE_STORAGE_KEY = 'import-err-items-state'
    static STORAGE_PREFIX = 'import-items-'
    static ERR_STORAGE_PREFIX = 'err-import-items-'
    static DEF_CHUNK_SIZE = 100
    static getInitEsts = () => ({
        calculatedAt: 0,
        completed: {
            [TYPE.BOOKMARK]: 0,
            [TYPE.HISTORY]: 0,
            [TYPE.OLD]: 0,
        },
        remaining: {
            [TYPE.BOOKMARK]: 0,
            [TYPE.HISTORY]: 0,
            [TYPE.OLD]: 0,
        },
    })
    static DEF_ALLOW_TYPES = {
        [TYPE.HISTORY]: true,
        [TYPE.BOOKMARK]: true,
        [TYPE.OLD]: true,
    }

    /**
     * @property {any} Object containing boolean flags for each import item type key, representing whether
     *  or not that type should be saved to state (user configurable via UI import-type checkboxes).
     */
    allowTypes = ImportStateManager.DEF_ALLOW_TYPES

    /**
     * @property {ItemTypeCount}
     */
    completed

    /**
     * @property {ItemTypeCount}
     */
    remaining

    /**
     * @property {number} MS since epoch representing time since last ests calculation.
     */
    calculatedAt

    /**
     * @property {string[]} Stack of different storage keys used for storing import items state.
     */
    storageKeyStack

    /**
     * @property {string[]} Stack of different storage keys used for storing error'd import items state.
     */
    errStorageKeyStack

    /**
     * @property {number}
     */
    chunkSize

    /**
     * @property {number} Index of the current error chunk
     */
    currErrChunk = 0

    /**
     * @param {number} [chunkSize] Unsigned int to represent size of chunks to return from each `getItems` iteration.
     */
    constructor(initChunkSize = ImportStateManager.DEF_CHUNK_SIZE) {
        this.chunkSize = initChunkSize

        // Attempt rehydrate  of imports state from local storage
        this.rehydrateState()
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

    /**
     * @returns {boolean} Denotes whether or not current est counts should be recalculated.
     */
    get shouldRecalcEsts() {
        return this.calculatedAt < Date.now() - ImportStateManager.DAY_IN_MS
    }

    /**
     * Attempt to rehydrate and init key stacks + est counts states from local storage.
     */
    async rehydrateState() {
        let initState, initErrState, initEstsState, initCalcdAt, initAllowTypes
        try {
            const {
                [STORAGE_KEYS.ALLOW_TYPES]: allowTypes,
                [ImportStateManager.ERR_STATE_STORAGE_KEY]: savedErrState,
                [ImportStateManager.STATE_STORAGE_KEY]: savedState,
                [ImportStateManager.ESTS_STORAGE_KEY]: {
                    calculatedAt,
                    ...savedEsts
                },
            } = await browser.storage.local.get({
                [STORAGE_KEYS.ALLOW_TYPES]: ImportStateManager.DEF_ALLOW_TYPES,
                [ImportStateManager.ERR_STATE_STORAGE_KEY]: [],
                [ImportStateManager.STATE_STORAGE_KEY]: [],
                [ImportStateManager.ESTS_STORAGE_KEY]: ImportStateManager.getInitEsts(),
            })
            initAllowTypes = allowTypes
            initState = savedState
            initErrState = savedErrState
            initEstsState = savedEsts
            initCalcdAt = calculatedAt
        } catch (error) {
            initAllowTypes = ImportStateManager.DEF_ALLOW_TYPES
            initState = []
            initErrState = []
            initEstsState = ImportStateManager.getInitEsts()
            initCalcdAt = 0
        } finally {
            this.allowTypes = initAllowTypes
            this.storageKeyStack = initState
            this.errStorageKeyStack = initErrState
            this.currErrChunk = this.errStorageKeyStack.length - 1
            this.counts = initEstsState
            this.calculatedAt = initCalcdAt
        }
    }

    /**
     * Sets persisted ests state to current local state.
    */
    _persistEsts = (customState = {}) =>
        browser.storage.local.set({
            [ImportStateManager.ESTS_STORAGE_KEY]: {
                ...this.counts,
                calculatedAt: this.calculatedAt,
            },
            ...customState,
        })

    async dirtyEsts() {
        this.calculatedAt = 0
        return await this._persistEsts()
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
     * Handles calculating the completed estimate counts for history, bookmark, and old-ext imports.
     *
     * @param {ImportItemCreator} creator Ready item creator instance to afford access to existing keys.
     */
    async _calcCompletedCounts(creator) {
        const {
            [OLD_EXT_KEYS.NUM_DONE]: numOldExtDone,
        } = await browser.storage.local.get({ [OLD_EXT_KEYS.NUM_DONE]: 0 })

        // Can sometimes return slightly different lengths for unknown reason
        const completedHistory = creator.histKeys.size - creator.bmKeys.size

        this.completed = {
            [TYPE.HISTORY]: completedHistory < 0 ? 0 : completedHistory,
            [TYPE.BOOKMARK]: creator.bmKeys.size,
            [TYPE.OLD]: numOldExtDone,
        }
    }

    /**
     * Handles calculating the remaining estimate counts for history, bookmark, and old-ext imports.
     *
     * @param {ImportItemCreator} creator Ready item creator instance to afford creating import items from browser data.
     */
    async _calcRemainingCounts(creator) {
        let bookmarkIds = new Set()

        // Import items creation will yield parts of the total items
        for await (let { data, type } of creator.createImportItems()) {
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
            const numAdded = await this.addItems(data, type)
            this.remaining[type] += numAdded // Inc count state
        }
    }

    /**
     * Main count calculation method which will create import items, and set state counts and item chunks.
     */
    async _calcCounts() {
        this.calculatedAt = Date.now()
        this.counts = ImportStateManager.getInitEsts() // Reset counts first

        await this.clearItems()

        // Create new ImportItemCreator to create import items from which we derive counts
        const creator = new ItemCreator()
        await creator.dataSourcesReady

        await this._calcCompletedCounts(creator)
        await this._calcRemainingCounts(creator)
    }

    /**
     * Attempts to fetch the estimate counts from local state or does a complete state recalculation
     * if it deems current state to be out-of-date.
     *
     * @return {EstimateCounts}
     */
    async fetchEsts() {
        // If saved calcs are old, or forced to, recalc
        if (this.shouldRecalcEsts) {
            // Perform calcs to update state
            await this._calcCounts()
            await this._persistEsts()
        }

        return this.counts
    }

    /**
     * @generator
     * @param {boolean} [includeErrs=true] Flag to decide whether to include error'd items in the Iterator.
     * @yields {any} Object containing `chunkKey` and `chunk` pair, corresponding to the chunk storage key
     *  and value at that storage key, respectively.
     */
    *getItems(includeErrs = false) {
        for (const chunkKey of this.storageKeyStack) {
            yield this._getChunk(chunkKey)
        }

        if (includeErrs) {
            yield* this.getErrItems()
        }
    }

    *getErrItems() {
        for (const chunkKey of this.errStorageKeyStack) {
            yield this._getChunk(chunkKey)
        }
    }

    /**
     * @param {string} key Key to attempt to find in error state.
     * @returns {Promise<boolean>} Resolves to flag denoting existence of `key`.
     */
    async _checkErrExists(key) {
        for await (const { chunk } of this.getErrItems()) {
            const chunkKeysSet = new Set(keys(chunk))

            if (chunkKeysSet.has(key)) {
                return true
            }
        }

        return false
    }

    /**
     * @param {Map<T,U>} inputMap Map to diff against current items state.
     * @returns {Map<T,U>} Subset (submap?) of `inputMap` containing no entries deemed to already exist in state.
     */
    async _diffAgainstState(inputMap) {
        let entries = [...inputMap]

        for await (const { chunk } of this.getItems()) {
            const currChunkKeys = new Set(keys(chunk))
            entries = entries.filter(([key]) => !currChunkKeys.has(key))
        }

        return new Map(entries)
    }

    _getNextChunkKey = () =>
        `${ImportStateManager.STORAGE_PREFIX}${this.storageKeyStack.length}`
    _getNextErrChunkKey = () =>
        `${ImportStateManager.ERR_STORAGE_PREFIX}${this.errStorageKeyStack
            .length}`

    /**
     * Splits up a Map into an Array of objects of specified size to use as state chunks.
     *
     * @param {Map<string|number, any>} map Map of key value pairs.
     * @returns {any[]} Array of objects of size `this.chunkSize`, created from input Map.
     */
    _splitChunks(map) {
        const pairs = [...map]
        const chunks = []

        for (let i = 0; i < pairs.length; i += this.chunkSize) {
            const pairsMap = new Map(pairs.slice(i, i + this.chunkSize))
            chunks.push(mapToObject(pairsMap))
        }

        return chunks
    }

    /**
     * @param {any} chunk Chunk of total state to store.
     */
    async _addChunk(chunk) {
        const chunkKey = this._getNextChunkKey()

        // Track new storage key in local key state
        this.storageKeyStack.push(chunkKey)

        const {
            [ImportStateManager.STATE_STORAGE_KEY]: oldKeyState,
        } = await browser.storage.local.get({
            [ImportStateManager.STATE_STORAGE_KEY]: [],
        })

        // Store new chunk + update persisted import chunk keys state
        await browser.storage.local.set({
            [chunkKey]: chunk,
            [ImportStateManager.STATE_STORAGE_KEY]: [...oldKeyState, chunkKey],
        })
    }

    async _getChunk(chunkKey) {
        const storage = await browser.storage.local.get(chunkKey)
        return { chunk: storage[chunkKey], chunkKey }
    }

    /**
     * @param {Map<string, ImportItem>} itemsMap Array of import items to add to state.
     * @param {IMPORT_TYPE} type
     * @returns {number} The amount of items added to state, post-filtering.
     */
    async addItems(itemsMap, type) {
        // Ensure no dupes get added
        const filteredData = await this._diffAgainstState(itemsMap)

        if (!filteredData.size) {
            return 0 // Die early if nothing needed
        }

        // Split into specific-size chunks (if enough input)
        for (const itemsChunk of this._splitChunks(filteredData)) {
            await this._addChunk(itemsChunk)
        }

        return filteredData.size
    }

    /**
     * @param {Map<string, ImportItem>} itemsMap Array of import items to set as state.
     */
    async setItems(itemsMap) {
        await this.clearItems()
        await this.addItems(itemsMap)
    }

    /**
     * Removes a single import item from its stored chunk.
     *
     * @param {string} chunkKey Storage key of chunk in which item wanted to remove exists.
     * @param {string} itemKey Key within chunk pointing item to remove.
     * @returns {ImportItem} The removed import item.
     */
    async removeItem(chunkKey, itemKey, isError = false) {
        const { [chunkKey]: chunk } = await browser.storage.local.get({
            [chunkKey]: {},
        })

        // Destructure existing state, removing the unwanted item, then update storage with remaining state
        const { [itemKey]: itemToRemove, ...remainingChunk } = chunk

        // Decrement remaining items count
        if (itemToRemove != null) {
            this._markOffItem(itemToRemove, isError)

            await this._persistEsts({ [chunkKey]: remainingChunk })
        }

        return itemToRemove
    }

    /**
     * Moves a single import item from its stored chunk to an error chunk.
     *
     * @param {string} chunkKey Storage key of chunk in which item wanted to flag exists.
     * @param {string} itemKey Key within chunk pointing item to flag.
     */
    async flagItemAsError(chunkKey, itemKey) {
        const item = await this.removeItem(chunkKey, itemKey, true)

        // Don't re-add if error already exists
        if (await this._checkErrExists(itemKey)) {
            return
        }

        let errChunkKey
        if (!this.errStorageKeyStack.length) {
            errChunkKey = ImportStateManager.ERR_STORAGE_PREFIX + '0'
            this.errStorageKeyStack.push(errChunkKey)
        } else {
            errChunkKey = this.errStorageKeyStack[
                this.errStorageKeyStack.length - 1
            ]
        }

        let { [errChunkKey]: existingChunk } = await browser.storage.local.get({
            [errChunkKey]: {},
        })

        // If curr error chunk is full, move on to the next one
        if (Object.keys(existingChunk).length >= this.chunkSize) {
            existingChunk = {}
            errChunkKey = this._getNextErrChunkKey()
            this.errStorageKeyStack.push(errChunkKey)
        }

        // Add current item to error chunk
        existingChunk[itemKey] = item

        return await browser.storage.local.set({
            [errChunkKey]: existingChunk,
            [ImportStateManager.ERR_STATE_STORAGE_KEY]: this.errStorageKeyStack,
        })
    }

    /**
     * Clears local non-persisted items states. Error items + import ests are not removed.
     */
    async clearItems() {
        // Remove persisted states from storage
        await browser.storage.local.remove([
            ...this.storageKeyStack,
            ImportStateManager.STATE_STORAGE_KEY,
        ])

        // Reset local state
        this.storageKeyStack = []
    }
}

const instance = new ImportStateManager()

export default instance
