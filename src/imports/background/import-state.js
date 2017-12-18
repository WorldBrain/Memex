import { mapToObject } from 'src/util/map-set-helpers'

export class ImportStateManager {
    static STATE_STORAGE_KEY = 'import-state-manager'
    static ERR_STATE_STORAGE_KEY = 'import-err-state-manager'
    static STORAGE_PREFIX = 'import-items-'
    static ERR_STORAGE_PREFIX = 'err-import-items-'
    static DEF_CHUNK_SIZE = 100

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
     * Attempt to rehydrate and init `storageKeyStack` state from local storage.
     */
    async rehydrateState() {
        let initState, initErrState
        try {
            const {
                [ImportStateManager.ERR_STATE_STORAGE_KEY]: savedErrState,
                [ImportStateManager.STATE_STORAGE_KEY]: savedState,
            } = await browser.storage.local.get({
                [ImportStateManager.ERR_STATE_STORAGE_KEY]: [],
                [ImportStateManager.STATE_STORAGE_KEY]: [],
            })
            initState = savedState
            initErrState = savedErrState
        } catch (error) {
            initState = []
            initErrState = []
        } finally {
            this.storageKeyStack = initState
            this.errStorageKeyStack = initErrState
            this.currErrChunk = this.errStorageKeyStack.length - 1
        }
    }

    /**
     * @generator
     * @param {boolean} [includeErrs=true] Flag to decide whether to include error'd items in the Iterator.
     * @yields {any} Object containing `chunkKey` and `chunk` pair, corresponding to the chunk storage key
     *  and value at that storage key, respectively.
     */
    *getItems(includeErrs = false) {
        for (const chunkKey of this.storageKeyStack) {
            yield this.getChunk(chunkKey)
        }

        if (includeErrs) {
            yield* this.getErrItems()
        }
    }

    *getErrItems() {
        for (const chunkKey of this.errStorageKeyStack) {
            yield this.getChunk(chunkKey)
        }
    }

    getNextChunkKey = () =>
        `${ImportStateManager.STORAGE_PREFIX}${this.storageKeyStack.length}`
    getNextErrChunkKey = () =>
        `${ImportStateManager.ERR_STORAGE_PREFIX}${this.errStorageKeyStack
            .length}`

    /**
     * Splits up a Map into an Array of objects of specified size to use as state chunks.
     *
     * @param {Map<string|number, any>} map Map of key value pairs.
     * @returns {any[]} Array of objects of size `this.chunkSize`, created from input Map.
     */
    splitChunks(map) {
        const pairs = [...map]
        const chunks = []

        for (let i = 0; i < pairs.length; i += this.chunkSize) {
            const pairsMap = new Map(pairs.slice(i, i + this.chunkSize))
            chunks.push(mapToObject(pairsMap))
        }

        return chunks
    }

    /**
     * @param {string} chunkKey Storage key to store chunk as a value of.
     * @param {any} chunk Chunk of total state to store.
     */
    async addChunk(chunk) {
        const chunkKey = this.getNextChunkKey()

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

    async getChunk(chunkKey) {
        const storage = await browser.storage.local.get(chunkKey)
        return { chunk: storage[chunkKey], chunkKey }
    }

    /**
     * @param {Map<string, ImportItem>} itemsMap Array of import items to add to state.
     */
    async addItems(itemsMap) {
        for (const itemsChunk of this.splitChunks(itemsMap)) {
            await this.addChunk(itemsChunk)
        }
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
     */
    async removeItem(chunkKey, itemKey) {
        const { [chunkKey]: chunk } = await browser.storage.local.get({
            [chunkKey]: {},
        })

        // Destructure existing state, removing the unwanted item, then update storage with remaining state
        const { [itemKey]: itemToRemove, ...remainingChunk } = chunk
        await browser.storage.local.set({ [chunkKey]: remainingChunk })

        return itemToRemove
    }

    /**
     * Moves a single import item from its stored chunk to an error chunk.
     *
     * @param {string} chunkKey Storage key of chunk in which item wanted to flag exists.
     * @param {string} itemKey Key within chunk pointing item to flag.
     */
    async flagAsError(chunkKey, itemKey) {
        const item = await this.removeItem(chunkKey, itemKey)

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
            errChunkKey = this.getNextErrChunkKey()
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
     * Clears all local and persisted states.
     */
    async clearItems() {
        let key

        // Remove each chunk data from state and storage
        while (this.storageKeyStack.length) {
            key = this.storageKeyStack.pop()
            await browser.storage.local.remove(key)
        }

        // Remove persisted state from storage
        await browser.storage.local.remove(ImportStateManager.STATE_STORAGE_KEY)
    }
}

const instance = new ImportStateManager()

export default instance
