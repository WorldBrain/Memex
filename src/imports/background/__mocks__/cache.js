import { mapToObject } from 'src/util/map-set-helpers'

export default class Cache {
    static DAY_IN_MS = 1000 * 60 * 60 * 24
    static INIT_ESTS = {
        calculatedAt: 0,
        completed: { b: 0, h: 0 },
        remaining: { b: 0, h: 0 },
    }
    static DEF_CHUNK_SIZE = 20

    chunks = []
    errChunks = []

    calculatedAt = 0

    constructor({
        initEsts = Cache.INIT_ESTS,
        chunkSize = Cache.DEF_CHUNK_SIZE,
    }) {
        this.counts = {
            completed: { ...initEsts.completed },
            remaining: { ...initEsts.remaining },
        }
        this._chunkSize = chunkSize
    }

    get expired() {
        return this.calculatedAt < Date.now() - Cache.DAY_IN_MS
    }

    set expired(value) {
        if (value === true) {
            this.calculatedAt = 0
        }
    }

    async _diffAgainstStored(inputMap) {
        let entries = [...inputMap]

        for await (const { chunk } of this.getItems(true)) {
            const currChunkKeys = new Set(Object.keys(chunk))
            entries = entries.filter(([key]) => !currChunkKeys.has(key))
        }

        return new Map(entries)
    }

    async persistItems(data) {
        const filteredData = await this._diffAgainstStored(data)

        this.chunks.push(mapToObject(filteredData))
        return data.size
    }

    async persistEsts(ests) {
        this.calculatedAt = Date.now()

        this.counts = { ...ests }
    }

    async *getItems(includeErrs = false) {
        for (const chunkKey in this.chunks) {
            yield {
                chunkKey: chunkKey.toString(),
                chunk: this.chunks[chunkKey],
            }
        }

        if (includeErrs) {
            for (const chunkKey in this.errChunks) {
                yield {
                    chunkKey: `err-${chunkKey}`,
                    chunk: this.errChunks[chunkKey],
                }
            }
        }
    }

    async removeItem(chunkKey, itemKey) {
        const { [itemKey]: toRemove, ...remaining } = this.chunks[chunkKey]
        this.chunks[chunkKey] = remaining
        return toRemove
    }

    async flagItemAsError(itemKey, item) {
        let chunkKey = !this.errChunks.length ? 0 : this.errChunks.length - 1
        let existing = this.errChunks[chunkKey] || {}

        if (Object.keys(existing) >= this._chunkSize) {
            existing = {}
            ++chunkKey
        }

        this.errChunks[chunkKey] = { ...existing, [itemKey]: item }
    }

    async clear() {
        this.expired = true
        this.chunks = []
        this.errChunks = []
    }
}
