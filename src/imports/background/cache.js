import keys from 'lodash/fp/keys'

import { IMPORT_TYPE as TYPE } from 'src/options/imports/constants'
import { mapToObject } from 'src/util/map-set-helpers'

/**
 * Handles persisting the import items, allowing them to be fetched in chunks.
 */
export default class ImportCache {
    static ESTS_STORAGE_KEY = 'import-estimate-counts'
    static STATE_STORAGE_KEY = 'import-items-state'
    static ERR_STATE_STORAGE_KEY = 'import-err-items-state'
    static STORAGE_PREFIX = 'import-items-'
    static ERR_STORAGE_PREFIX = 'err-import-items-'
    static DAY_IN_MS = 1000 * 60 * 60 * 24
    static DEF_CHUNK_SIZE = 100

    static INIT_ESTS = {
        calculatedAt: 0,
        completed: {
            [TYPE.BOOKMARK]: 0,
            [TYPE.HISTORY]: 0,
        },
        remaining: {
            [TYPE.BOOKMARK]: 0,
            [TYPE.HISTORY]: 0,
        },
    }

    /**
     * @type {string[]} Stack of different storage keys used for storing import items state.
     */
    storageKeyStack

    /**
     * @type {string[]} Stack of different storage keys used for storing error'd import items state.
     */
    errStorageKeyStack

    /**
     * @type {number} MS since epoch representing time since last ests calculation.
     */
    calculatedAt

    /**
     * @type {number}
     */
    chunkSize

    /**
     * @param {string} chunkKey
     * @return {{ chunk: any | null, chunkKey: string }} Object containing the data for that chunk + the chunk key.
     */
    static async _getChunk(chunkKey) {
        const storage = await browser.storage.local.get(chunkKey)
        return { chunk: storage[chunkKey], chunkKey }
    }

    constructor({ initChunkSize = ImportCache.DEF_CHUNK_SIZE }) {
        this.chunkSize = initChunkSize

        this.ready = this._rehydrate()
    }

    /**
     * @returns {boolean} Denotes whether or not current est counts should be recalculated.
     */
    get expired() {
        return this.calculatedAt < Date.now() - ImportCache.DAY_IN_MS
    }

    set expired(value) {
        if (value === true) {
            this.calculatedAt = 0
        }
    }

    /**
     * Attempt to rehydrate and init key stacks + est counts states from local storage.
     */
    async _rehydrate() {
        let initState, initErrState, initEstsState, initCalcdAt
        try {
            const {
                [ImportCache.ERR_STATE_STORAGE_KEY]: savedErrState,
                [ImportCache.STATE_STORAGE_KEY]: savedState,
                [ImportCache.ESTS_STORAGE_KEY]: { calculatedAt, ...savedEsts },
            } = await browser.storage.local.get({
                [ImportCache.ERR_STATE_STORAGE_KEY]: [],
                [ImportCache.STATE_STORAGE_KEY]: [],
                [ImportCache.ESTS_STORAGE_KEY]: ImportCache.INIT_ESTS,
            })
            initState = savedState
            initErrState = savedErrState
            initEstsState = savedEsts
            initCalcdAt = calculatedAt
        } catch (error) {
            initState = []
            initErrState = []
            initEstsState = ImportCache.INIT_ESTS
            initCalcdAt = 0
        } finally {
            this.storageKeyStack = initState
            this.errStorageKeyStack = initErrState
            this.counts = initEstsState
            this.calculatedAt = initCalcdAt
        }
    }

    _getNextChunkKey = () =>
        `${ImportCache.STORAGE_PREFIX}${this.storageKeyStack.length}`
    _getNextErrChunkKey = () =>
        `${ImportCache.ERR_STORAGE_PREFIX}${this.errStorageKeyStack.length}`

    async persistEsts(ests) {
        this.calculatedAt = Date.now()

        await browser.storage.local.set({
            [ImportCache.ESTS_STORAGE_KEY]: {
                ...ests,
                calculatedAt: this.calculatedAt,
            },
        })
    }

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
     * @param {Map<T,U>} inputMap Map to diff against current items state.
     * @param {boolean} includeErrs
     * @returns {Map<T,U>} Subset (submap?) of `inputMap` containing no entries deemed to already exist in state.
     */
    async _diffAgainstStored(inputMap, includeErrs) {
        let entries = [...inputMap]

        for await (const { chunk } of this.getItems(!includeErrs)) {
            const currChunkKeys = new Set(keys(chunk))
            entries = entries.filter(([key]) => !currChunkKeys.has(key))
        }

        return new Map(entries)
    }

    /**
     * @param {any} chunk Chunk of total state to store.
     */
    async _addChunk(chunk) {
        const chunkKey = this._getNextChunkKey()

        // Track new storage key in local key state
        this.storageKeyStack.push(chunkKey)

        // Store new chunk + update persisted import chunk keys state
        await browser.storage.local.set({
            [chunkKey]: chunk,
            [ImportCache.STATE_STORAGE_KEY]: [...this.storageKeyStack],
        })
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
     * @param {Map<string, ImportItem>} itemsMap URL keys to ImportItem values to persist
     * @param {IMPORT_TYPE} type
     * @param {boolean} [includeErrs=false]
     * @returns {number} The amount of items added to cache, post-filtering.
     */
    async persistItems(itemsMap, includeErrs = false) {
        const filteredData = await this._diffAgainstStored(
            itemsMap,
            includeErrs,
        )

        if (!filteredData.size) {
            return 0 // Die early if nothing needed
        }

        // Split into specific-size chunks (if enough input)
        for (const itemsChunk of this._splitChunks(filteredData)) {
            await this._addChunk(itemsChunk)
        }

        return filteredData.size
    }

    async *getItems(includeErrs = false) {
        for (const chunkKey of this.storageKeyStack) {
            yield await ImportCache._getChunk(chunkKey)
        }

        if (includeErrs) {
            yield* this.getErrItems()
        }
    }

    async *getErrItems() {
        for (const chunkKey of this.errStorageKeyStack) {
            yield await ImportCache._getChunk(chunkKey)
        }
    }

    /**
     * @param {string} chunkKey
     * @param {string} itemKey
     * @return {ImportItem | null} The removed import item, corresponding to `itemKey`, if exists
     */
    async removeItem(chunkKey, itemKey) {
        const { [chunkKey]: chunk } = await browser.storage.local.get({
            [chunkKey]: {},
        })

        // Destructure existing state, removing the unwanted item
        const { [itemKey]: itemToRemove, ...remainingChunk } = chunk

        if (itemToRemove != null) {
            // Then update storage with remaining state, if anything was removed
            await browser.storage.local.set({ [chunkKey]: remainingChunk })
        }

        return itemToRemove
    }

    /**
     * @param {string} itemKey
     * @param {ImportItem} item
     * @return {Promise<void>}
     */
    async flagItemAsError(itemKey, item) {
        // Don't re-add if error already exists
        if (await this._checkErrExists(itemKey)) {
            return
        }

        // Get latest in-use chunk key
        let errChunkKey
        if (!this.errStorageKeyStack.length) {
            errChunkKey = ImportCache.ERR_STORAGE_PREFIX + '0'
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
        if (keys(existingChunk).length >= this.chunkSize) {
            existingChunk = {}
            errChunkKey = this._getNextErrChunkKey()
            this.errStorageKeyStack.push(errChunkKey)
        }

        // Add current item to error chunk
        existingChunk[itemKey] = item

        await browser.storage.local.set({
            [errChunkKey]: existingChunk,
            [ImportCache.ERR_STATE_STORAGE_KEY]: this.errStorageKeyStack,
        })
    }

    /**
     * Clears local non-persisted items states. Error items + import ests are not removed.
     */
    async clear() {
        // Remove persisted states from storage
        await browser.storage.local.remove([
            ...this.storageKeyStack,
            ImportCache.STATE_STORAGE_KEY,
        ])

        // Reset local state
        this.storageKeyStack = []
    }
}
