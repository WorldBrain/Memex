/* eslint promise/param-names: 0 */
import initSearchIndex from 'search-index'
import reduce from 'lodash/fp/reduce'
import stream from 'stream'
import JSONStream from 'JSONStream'

export const INDEX_STORAGE_KEY = 'search-index'
// How many different keys in local storage are being used
export let storageKeyCount = 0
export const SERIALIZE_BUFFER_SIZE = 10000000 // 5 MB

const indexOpts = {
    batchSize: 500,
    indexPath: 'test',
    preserveCase: false,
    compositeField: false,
    nGramLength: { gte: 1, lte: 5 },
    separator: /[|' .,\-|(\n)]+/,
    stopwords: require('stopword').en,
}

class StorageReader extends stream.Readable {
    constructor(options) {
        super(options)

        // State used to iterate through storage keys
        this.currentStorageKey = 0
    }

    _fetchFromStorage = async key =>
        (await browser.storage.local.get(key))[key] || null

    async _read() {
        const storageKey = `${INDEX_STORAGE_KEY}-${this.currentStorageKey++}`
        const data = await this._fetchFromStorage(storageKey)
        this.push(data)
    }
}

class StorageWriter extends stream.Writable {
    constructor(options = { bufferSize: SERIALIZE_BUFFER_SIZE }) {
        const { bufferSize, ...writableOpts } = options
        super(writableOpts)

        // Dumb buffer to keep data in before writing out to a new key when `bufferSize` is reached
        this.dataBuffer = ''
        this.bufferSize = bufferSize || SERIALIZE_BUFFER_SIZE
    }

    _isBufferFull = () => this.dataBuffer.length > this.bufferSize

    // Writes out data buffer to the next storage key; resets buffer
    async _writeOutBuffer() {
        const storageKey = `${INDEX_STORAGE_KEY}-${storageKeyCount++}`
        await browser.storage.local.set({ [storageKey]: this.dataBuffer })
        this.dataBuffer = '' // Reset data buffer
    }

    async _write(chunk, _, next) {
        let err
        try {
            if (this._isBufferFull()) {
                await this._writeOutBuffer()
            } else {
                this.dataBuffer += chunk.toString()
            }
        } catch (error) {
            err = error
        } finally {
            next(err)
        }
    }

    async _final(next) {
        let err
        try {
            await this._writeOutBuffer() // Write out remaining data in buffer
        } catch (error) {
            err = error
        } finally {
            next(err)
        }
    }
}

const combineContentStrings = reduce((result, val) => `${result}\n${val}`, '')

const standardResponse = (resolve, reject) =>
    (err, data = true) => err ? reject(err) : resolve(data)

/**
 * Transforms any of our page, bookmark, or visit docs to docs to build the search index around.
 * Only searchable data is brought over and joined into `content` key.
 */
const transformPouchDoc = ({ _id: id, content = {}, visitStart, timestamp, page = {} }) => ({
    id,
    content: combineContentStrings(content),
    timestamp: visitStart || timestamp,
    assocPageId: page._id,
})

const indexP = new Promise((...args) => initSearchIndex(indexOpts, standardResponse(...args)))


export const instance = () => indexP

export async function add(docs) {
    const index = await indexP
    const input = (docs instanceof Array ? docs : [docs]).map(transformPouchDoc)

    return new Promise((...args) => index.concurrentAdd(indexOpts, input, standardResponse(...args)))
}

export async function count(query) {
    const index = await indexP

    return new Promise((...args) => index.totalHits(query, standardResponse(...args)))
}

export async function findOne(query) {
    const index = await indexP

    return new Promise((resolve, reject) =>
        index.search(query)
            .on('data', resolve)
            .on('error', reject))
}

export async function find(query) {
    const index = await indexP
    let data = []

    return new Promise((resolve, reject) =>
        index.search(query)
            .on('data', datum => data.push(datum))
            .on('error', reject)
            .on('end', () => resolve(data)))
}

export async function findStream(query) {
    const index = await indexP

    return index.search(query)
}

export async function size() {
    const index = await indexP

    return new Promise((...args) => index.countDocs(standardResponse(...args)))
}

export async function store() {
    const index = await indexP

    return new Promise((resolve, reject) => {
        const storageStream = new StorageWriter()
            .on('error', reject)
            .on('finish', () => resolve('finished storing'))

        index.dbReadStream({ gzip: true })
            .pipe(JSONStream.stringify('', '\n', ''))
            .pipe(storageStream)
            .on('error', reject)
    })
}

export async function restore() {
    const index = await indexP

    return new Promise((resolve, reject) => {
        const indexWriteStream = index.dbWriteStream()
            .on('error', reject)
            .on('finish', () => resolve('finished restoring'))

        new StorageReader()
            .pipe(JSONStream.parse())
            .pipe(indexWriteStream)
            .on('error', reject)
    })
}

export async function destroy() {
    const index = await indexP

    return new Promise((resolve, reject) =>
        index.flush(err =>
            err ? reject(err) : resolve('index destroyed')))
}
