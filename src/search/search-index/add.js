import index, { DEFAULT_TERM_SEPARATOR } from '.'
import { transformPageAndMetaDocs } from './transforms'
import { initSingleLookup } from './util'

const singleLookup = initSingleLookup()

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * is *NOT* concurrency safe.
 * @param {any} Object containing a `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export const addPage = docs =>
    performIndexing(transformPageAndMetaDocs(DEFAULT_TERM_SEPARATOR)(docs))

/**
 * TODO: Implement queueing for concurrent-safeness
 */
export const addPageConcurrent = docs => addPage(docs)

const createTermValue = indexDoc =>
    new Map([[indexDoc.id, new Map([['latest', indexDoc.latest]])]])

const createTimestampValue = indexDoc => new Map([[indexDoc.id]])

const initReduceTermValue = indexDoc => value => {
    if (value == null) {
        return createTermValue(indexDoc)
    }

    return new Map([...value, ...createTermValue(indexDoc)])
}

const initReduceTimestampValue = indexDoc => value => {
    if (value == null) {
        return createTimestampValue(indexDoc)
    }

    if (value.has(indexDoc.id)) {
        throw Error('Already indexed')
    }

    value.set(indexDoc.id)
    return value
}

const indexTerms = async indexDoc => {
    const indexBatch = index.batch()
    const reduceTermValue = initReduceTermValue(indexDoc)

    for (const term of indexDoc.terms) {
        const termValue = reduceTermValue(await singleLookup(term))
        indexBatch.put(term, termValue)
    }

    return new Promise(resolve => indexBatch.write(resolve))
}

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

    return new Promise(resolve => indexBatch.write(resolve))
}

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

// Runs all standard indexing on the index doc
async function performIndexing(indexDoc) {
    console.log('ADDING PAGE')
    console.log(indexDoc)

    if (!indexDoc.terms.size) {
        return
    }

    try {
        // Run indexing of page
        console.time('indexing page')
        await indexPage(indexDoc)
        console.timeEnd('indexing page')

        // Run indexing of terms
        console.time('indexing terms')
        await indexTerms(indexDoc)
        console.timeEnd('indexing terms')

        // Run indexing of meta timestamps
        console.time('indexing meta times')
        await indexMetaTimestamps(indexDoc)
        console.timeEnd('indexing meta times')
    } catch (err) {
        console.error(err)
    }
}
