/* eslint promise/param-names: 0 */
import initSearchIndex from 'search-index'
import stream from 'stream'
import stopword from 'stopword'

import pipeline from './search-index-pipeline'
import { convertMetaDocId } from 'src/activity-logger'

const indexOpts = {
    batchSize: 500,
    appendOnly: true,
    indexPath: 'worldbrain-index',
    logLevel: 'info',
    preserveCase: false,
    compositeField: false,
    nGramLength: 1,
    separator: /[|' .,\-|(\n)]+/,
    stopwords: stopword.en,
    fieldOptions: {
        visits: {
            fieldedSearch: true,
        },
        bookmarks: {
            fieldedSearch: true,
        },
        content: {
            fieldedSearch: true,
        },
        url: {
            weight: 10,
            fieldedSearch: true,
            separator: '/',
        },
    },
}

const standardResponse = (resolve, reject) =>
    (err, data = true) => err ? reject(err) : resolve(data)

// Simply extracts the timestamp component out the ID of a visit or bookmark doc,
//  which is the only data we want at the moment.
const transformMetaDoc = doc => convertMetaDocId(doc._id).timestamp

// Groups input docs into standard index doc structure
const transformPageAndMetaDocs = ({ pageDoc, visitDocs = [], bookmarkDocs = [] }) => ({
    ...pipeline(pageDoc),
    visits: visitDocs.map(transformMetaDoc),
    bookmarks: bookmarkDocs.map(transformMetaDoc),
})

// Wraps instance creation in a Promise for use in async interface methods
const indexP = new Promise((...args) => initSearchIndex(indexOpts, standardResponse(...args)))

/**
 * @param doc The doc to queue up for adding into the index.
 * @returns Boolean denoting that the add was successful (else error thrown).
 */
async function addConcurrent(doc) {
    const index = await indexP
    const input = [doc]

    return new Promise((...args) => index.concurrentAdd(indexOpts, input, standardResponse(...args)))
}

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * uses the concurrency-safe index add method.
 * @param {any} Object containing a `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export async function addPageConcurrent({ pageDoc, visitDocs = [], bookmarkDocs = [] }) {
    const indexDoc = transformPageAndMetaDocs({ pageDoc, visitDocs, bookmarkDocs })

    return await addConcurrent(indexDoc)
}

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * is *NOT* concurrency safe.
 * @param {any} Object containing a `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export async function addPage({ pageDoc, visitDocs = [], bookmarkDocs = [] }) {
    const index = await indexP

    const indexDoc = transformPageAndMetaDocs({ pageDoc, visitDocs, bookmarkDocs })

    return new Promise((resolve, reject) => {
        // Set up add pipeline
        const inputStream = new stream.Readable({ objectMode: true })
        inputStream
            .pipe(index.defaultPipeline())
            .pipe(index.add())
            .on('finish', resolve)
            .on('error', reject)

        // Push index doc onto stream + null to signify end-of-stream
        inputStream.push(indexDoc)
        inputStream.push(null)
    })
}

/**
 * Returns a function that affords adding either a visit or bookmark to an index.
 * The function should perform the following update, using the associated page doc ID:
 *  - grab the existing index doc matching the page doc ID
 *  - perform update to appropriate timestamp field, by APPENDING new timestamp to field
 *  - delete the original doc form the index
 *  - add the updated doc into the index
 * NOTE: this appends the timestamp extracted from the given metaDoc, hence to maintain an
 * order, this should generally only get called on new visits/bookmark events.
 */
const addTimestamp = field => async metaDoc => {
    const indexDocId = metaDoc.page._id // Index docs share ID with corresponding pouch page doc
    const existingDoc = await get(indexDocId) // Get existing indexed doc
    if (!existingDoc) {
        throw new Error('Page associated with timestamp is not recorded in the index')
    }

    (existingDoc[field] || []).push(transformMetaDoc(metaDoc)) // Perform in-memory update
    await del(indexDocId) // Delete existing doc
    return addConcurrent(existingDoc) // Add new updated doc
}

export const addVisit = addTimestamp('visits')
export const addBookmark = addTimestamp('bookmarks')

/**
 * Returns a function that affords removing either a visit or bookmark from the index.
 * The function should perform the following update, using the associated page doc ID:
 *  - grab the existing index doc matching the page doc ID
 *  - perform update to appropriate timestamp field, removing the existing ID
 *  - delete the original doc form the index
 *  - add the updated doc into the index
 */
const removeTimestamp = field => async metaDoc => {
    const indexDocId = metaDoc.page._id // Index docs share ID with corresponding pouch page doc
    const existingDoc = await get(indexDocId) // Get existing doc
    if (!existingDoc) {
        throw new Error('Page associated with timestamp is not recorded in the index')
    }

    // Perform in-memory update by removing the timestamp
    const indexToRemove = existingDoc[field].indexOf(transformMetaDoc(metaDoc))
    if (indexToRemove === -1) {
        throw new Error('Associated timestamp is not recorded in the index')
    }
    existingDoc[field] = [
        ...existingDoc[field].slice(0, indexToRemove),
        ...existingDoc[field].slice(indexToRemove + 1),
    ]

    await del(indexDocId) // Delete existing doc
    return addConcurrent(existingDoc) // Add new updated doc
}

export const removeVisit = removeTimestamp('visits')
export const removeBookmark = removeTimestamp('bookmarks')


// Below are mostly standard Promise wrappers around search-index stream-based methods

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

export const instance = () => indexP

export async function count(query) {
    const index = await indexP

    return new Promise((...args) => index.totalHits(query, standardResponse(...args)))
}

// Batches stream results to be all returned in Promise resolution.
export async function search(query) {
    const index = await indexP
    let data = []

    return new Promise((resolve, reject) =>
        index.search(query)
            .on('data', datum => data.push(datum))
            .on('error', reject)
            .on('end', () => resolve(data)))
}

// Resolves to the stream from search-index's `.search`.
export async function searchStream(query) {
    const index = await indexP

    return index.search(query)
}

export async function size() {
    const index = await indexP

    return new Promise((...args) => index.countDocs(standardResponse(...args)))
}

export async function destroy() {
    const index = await indexP

    return new Promise((resolve, reject) =>
        index.flush(err =>
            err ? reject(err) : resolve('index destroyed')))
}
