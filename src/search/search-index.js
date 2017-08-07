/* eslint promise/param-names: 0 */
import initSearchIndex from 'search-index'
import reduce from 'lodash/fp/reduce'
import stream from 'stream'
import JSONStream from 'JSONStream'

import db, { normaliseFindResult } from 'src/pouchdb'
import QueryBuilder from './query-builder'

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
    fieldOptions: {
        visitTimestamps: {
            fieldedSearch: true,
        },
        bookmarkTimestamps: {
            fieldedSearch: true,
        },
        content: {
            fieldedSearch: true,
        },
    }
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
 * Transforms a page doc to doc structured for use with the index.
 * All searchable page data (content) is concatted to make a composite field.
 * This represents the general structure for index docs.
 */
const transformPageDoc = ({ _id: id, content = {}, bookmarkTimestamps = [], visitTimestamps = [] }) => ({
    id,
    content: combineContentStrings(content),
    bookmarkTimestamps,
    visitTimestamps,
})

/**
 * Simply maps out the ID of visit or bookmark docs. The ID contains
 * timestamp, which is the only data we want at the moment.
 */
const transformTimeDoc = ({ _id: id }) => id

/**
 * Creates an object based on an array of page docs, indexing them via ID.
 */
const createPagesObject = reduce((result, pageDoc) => ({
    ...result,
    [pageDoc._id]: transformPageDoc(pageDoc),
}), {})

const indexP = new Promise((...args) => initSearchIndex(indexOpts, standardResponse(...args)))

export const instance = () => indexP

export async function addPage({ pageDoc, visitDocs = [], bookmarkDocs = [] }) {
    const index = await indexP

    const visitTimestamps = visitDocs.length ? visitDocs.map(transformTimeDoc) : []
    const bookmarkTimestamps = bookmarkDocs.length ? bookmarkDocs.map(transformTimeDoc) : []
    const input = [transformPageDoc({ ...pageDoc, visitTimestamps, bookmarkTimestamps })]

    return new Promise((...args) => index.concurrentAdd(indexOpts, input, standardResponse(...args)))
}

export async function addPages({ pageDocs, visitDocs = [], bookmarkDocs = [] }) {
    const index = await indexP

    // Transform pages to objects with keys as `_id`s
    const pages = createPagesObject(pageDocs)

    // Update the pages object with bookmark/visit timestamps
    const updatePageTimes = field => ({ _id, page }) => {
        if (pages[page._id]) {
            pages[page._id][field].push(_id)
        }
    }

    visitDocs.forEach(updatePageTimes('visitTimestamps'))
    bookmarkDocs.forEach(updatePageTimes('bookmarkTimestamps'))

    // Extract document values out of ID-indexed object
    const input = Object.values(pages)

    return new Promise((...args) => index.concurrentAdd(indexOpts, input, standardResponse(...args)))
}

/**
 * Returns a function that affords adding either a visit or bookmark to an index.
 * The function should perform the following update, using the associated page doc ID:
 *  - grab the existing index doc matching the page doc ID
 *  - perform update to appropriate timestamp field
 *  - delete the original doc form the index
 *  - add the updated doc into the index
 */
const addTimestamp = field => async ({ _id, page })  => {
    const index = await indexP

    const existingDoc = await get(page._id) // Get existing doc
    if (!existingDoc) {
        throw new Error('Page associated with timestamp is not recorded in the index')
    }

    (existingDoc[field] || []).push(_id) // Perform in-memory update
    await del(page._id) // Delete existing doc
    return add(existingDoc) // Add new updated doc
}

export const addVisit = addTimestamp('visitTimestamps')
export const addBookmark = addTimestamp('bookmarkTimestamps')

/**
 * Returns a function that affords removing either a visit or bookmark from the index.
 * The function should perform the following update, using the associated page doc ID:
 *  - grab the existing index doc matching the page doc ID
 *  - perform update to appropriate timestamp field, removing the existing ID
 *  - delete the original doc form the index
 *  - add the updated doc into the index
 */
const removeTimestamp = field => async ({ _id, page }) => {
    const index = await indexP

    const existingDoc = await get(page._id) // Get existing doc
    if (!existingDoc) {
        throw new Error('Page associated with timestamp is not recorded in the index')
    }

    // Perform in-memory update by removing the timestamp
    const indexToRemove = existingDoc[field].indexOf(_id)
    if (indexToRemove === -1) {
        throw new Error('Associated timestamp is not recorded in the index')
    }
    existingDoc[field] = [
        ...existingDoc[field].slice(0, indexToRemove),
        ...existingDoc[field].slice(indexToRemove + 1),
    ]

    await del(page._id) // Delete existing doc
    return add(existingDoc) // Add new updated doc
}

export const removeVisit = removeTimestamp('visitTimestamps')
export const removeBookmark = removeTimestamp('bookmarkTimestamps')

/**
 * @param {string|Array<string>} ids Single ID, or array of IDs, of docs to attempt to find in the index.
 * @returns A single index doc that matches the supplied ID.
 */
export async function get(ids) {
    const index = await indexP

    // Typeguard on input; handle either array or single
    const isSingle = typeof ids === 'string'
    let found = []

    return new Promise((resolve, reject) =>
        index.get(isSingle ? [ids] : ids)
            .on('data', datum => found.push(datum))
            .on('error', reject)
            .on('end', () => resolve(isSingle ? found[0] : found)))
}

/**
 * @param {string|Array<string>} ids Single ID, or array of IDs, of docs to attempt to delete from the index.
 * @returns Boolean denoting that the delete was successful (else error thrown).
 */
export async function del(ids) {
    const index = await indexP

    // Typeguard on input; make single ID into array if need be
    const toDelete = typeof ids === 'string' ? [ids] : ids

    return new Promise((...args) => index.del(toDelete, standardResponse(...args)))
}

/**
 * @param doc The doc to queue up for adding into the index.
 * @returns Boolean denoting that the add was successful (else error thrown).
 */
export async function add(doc) {
    const index = await indexP
    const input = [doc]

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

// Gets all the "ok" docs in returned array
const bulkResultsToArray = ({ results }) =>
    results
        .map(res => res.docs)
        .map(list => list.filter(doc => doc.ok))
        .filter(list => list.length)
        .map(list => list[0].ok)

export async function filterVisitsByQuery({
    query,
    startDate = 0,
    endDate = Date.now(),
    skipUntil,
    limit = 10,
}) {
    const indexQuery = new QueryBuilder()
        .searchTerm(query || '')
        .startDate(startDate || 0)
        .endDate(endDate || Date.now)
        .skipUntil(skipUntil || undefined)
        .limit(limit || 10)
        .get()
    console.log(indexQuery) // DEBUG

    // Using index results, fetch matching pouch docs
    const results = await find(query)
    const docIds = results.map(res => ({ id: res.id }))
    const bulkRes = await db.bulkGet({ docs: docIds })
    const normalised = normaliseFindResult({ docs: bulkResultsToArray(bulkRes) })

    return {
        rows: normalised.rows,
        resultExhausted: results.length < limit,
    }
}
