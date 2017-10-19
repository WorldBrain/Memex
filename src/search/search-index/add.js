import index, { DEFAULT_TERM_SEPARATOR, indexQueue } from '.'
import { transformPageAndMetaDocs } from './transforms'
import { initSingleLookup, idbBatchToPromise } from './util'

const singleLookup = initSingleLookup()

/**
 * @typedef IndexValue
 * @type {Object}
 * @property {string} [latest] Latest visit/bookmark timestamp time for easy scoring.
 */

/**
 * @typedef IndexRequest
 * @type {Object}
 * @property {PageDoc} pageDoc
 * @property {VisitDoc[]} [visitDocs]
 * @property {BookmarkDoc[]} [bookmarkDocs]
 */

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * is *NOT* concurrency safe.
 * @param {IndexRequest} req A `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise<void>} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export const addPage = req =>
    performIndexing(transformPageAndMetaDocs(DEFAULT_TERM_SEPARATOR)(req))

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * is concurrency safe as it uses a single queue instance to batch add requests.
 * @param {IndexRequest} req A `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {void}
 */
export const addPageConcurrent = req => indexQueue.push(() => addPage(req))

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Map<string, IndexValue>}
 */
const createTermValue = indexDoc =>
    new Map([[indexDoc.id, { latest: indexDoc.latest }]])

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Map<string, IndexValue>}
 */
const createTimestampValue = indexDoc => new Map([[indexDoc.id, {}]])

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {(value?: IndexValue) => Map<string, IndexValue>}
 */
const initReduceTermValue = indexDoc => value => {
    if (value == null) {
        return createTermValue(indexDoc)
    }

    return new Map([...value, ...createTermValue(indexDoc)])
}

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {(value?: IndexValue) => Map<string, IndexValue>}
 */
const initReduceTimestampValue = indexDoc => value => {
    if (value == null) {
        return createTimestampValue(indexDoc)
    }

    if (value.has(indexDoc.id)) {
        throw Error('Already indexed')
    }

    return new Map([...value, ...createTimestampValue(indexDoc)])
}

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
const indexTerms = async indexDoc => {
    const indexBatch = index.batch()
    const reduceTermValue = initReduceTermValue(indexDoc)

    for (const term of indexDoc.terms) {
        const termValue = reduceTermValue(await singleLookup(term))
        indexBatch.put(term, termValue)
    }

    return idbBatchToPromise(indexBatch)
}

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
const indexMetaTimestamps = async indexDoc => {
    const indexBatch = index.batch()
    const reduceTimestampValue = initReduceTimestampValue(indexDoc)
    const timestamps = [...indexDoc.bookmarks, ...indexDoc.visits]

    for (const timestamp of timestamps) {
        try {
            const timestampValue = reduceTimestampValue(
                await singleLookup(timestamp),
            )
            indexBatch.put(timestamp, timestampValue)
        } catch (error) {
            // Already indexed; skip
        }
    }

    return idbBatchToPromise(indexBatch)
}

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
const indexPage = async indexDoc => {
    const existingDoc = await singleLookup(indexDoc.id)

    if (!existingDoc) {
        return index.put(indexDoc.id, indexDoc)
    }

    // Ensure the terms and meta timestamps get merged with existing
    return index.put(indexDoc.id, {
        ...indexDoc,
        terms: new Set([...existingDoc.terms, ...indexDoc.terms]),
        visits: new Set([...existingDoc.visits, ...indexDoc.visits]),
        bookmarks: new Set([...existingDoc.bookmarks, ...indexDoc.bookmarks]),
    })
}

/**
 * Runs all indexing logic on the page data concurrently for different types
 * as they all live on separate indexes.
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
async function performIndexing(indexDoc) {
    console.log('ADDING PAGE')
    console.log(indexDoc)

    if (!indexDoc.terms.size) {
        return
    }

    try {
        // Run indexing of page
        console.time('indexing page')
        await Promise.all([
            indexPage(indexDoc),
            indexTerms(indexDoc),
            indexMetaTimestamps(indexDoc),
        ])
        console.timeEnd('indexing page')
    } catch (err) {
        console.error(err)
    }
}
