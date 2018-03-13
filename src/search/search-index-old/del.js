import index, { indexQueue } from '.'
import { initSingleLookup, initLookupByKeys, idbBatchToPromise } from './util'

const singleLookup = initSingleLookup()

/**
 * @param {string|string[]} keys Single or array of keys to attempt to delete.
 * @return {Promise<void>}
 */
export async function del(keys) {
    if (!Array.isArray(keys)) {
        return index.del(keys)
    }

    const indexBatch = index.batch()
    keys.forEach(key => indexBatch.del(key))
    return idbBatchToPromise(indexBatch)
}

/**
 * Deletes all indexed data associated with given pages or page IDs. This method is **not**
 *  concurrency-safe.
 * @param {string|Array<string>} pageIds Single ID, or array of IDs, of docs to attempt to delete from the index.
 * @returns {Promise<void>}
 */
export async function delPages(pageIds) {
    if (Array.isArray(pageIds)) {
        for (const pageId of pageIds) {
            try {
                await performDeindexing(pageId)
            } catch (error) {
                // Ignore and continue deindexing rest
            }
        }
    } else {
        await performDeindexing(pageIds)
    }
}

/**
 * Concurrency-safe version of `delPages`
 * @param {string|Array<string>} pageIds Single ID, or array of IDs, of docs to attempt to delete from the index.
 * @returns {Promise<void>}
 */
export const delPagesConcurrent = pageIds =>
    new Promise((resolve, reject) =>
        indexQueue.push(() =>
            delPages(pageIds)
                .then(resolve)
                .catch(reject),
        ),
    )

/**
 * @param {IndexTermValue} [currTermValue]
 * @param {IndexLookupDoc} indexDoc
 * @returns {IndexTermValue} Updated `currTermValue` with entry for `indexDoc` removed.
 */
function reduceValue(currTermValue, indexDoc) {
    if (currTermValue == null) {
        return new Map()
    }
    currTermValue.delete(indexDoc.id)
    return currTermValue
}

/**
 * For an array of terms on an IndexLookupDoc will remove the index entry for `indexDoc.id`
 * under each value associated with a term key.
 *
 * @param {IndexLookupDoc} indexDoc The lookup doc containing assoc. term keys.
 * @returns {Promise<void>} Resolves when all updates finished.
 */
const initDeindexTerms = termsField => async indexDoc => {
    const indexBatch = index.batch()

    const termValuesMap = await initLookupByKeys()([...indexDoc[termsField]])

    // Schedule updates of all associated term values
    for (const [term, currTermVal] of termValuesMap) {
        const newTermVal = reduceValue(currTermVal, indexDoc)

        // If reduces to empty obj delete KVP, else update
        if (!newTermVal.size) {
            indexBatch.del(term)
        } else {
            indexBatch.put(term, newTermVal)
        }
    }

    return new Promise(resolve => indexBatch.write(resolve))
}

const deindexTerms = initDeindexTerms('terms')
const deindexUrlTerms = initDeindexTerms('urlTerms')
const deindexTitleTerms = initDeindexTerms('titleTerms')
const deindexTags = initDeindexTerms('tags')

/**
 * @param {IndexLookupDoc} indexDoc The lookup doc containing assoc. time keys.
 * @returns {Promise<void>} Resolves when all deletes finished.
 */
async function deindexTimestamps({ visits, bookmarks }) {
    const indexBatch = index.batch()
    const timeKeys = [...bookmarks, ...visits]
    timeKeys.forEach(timeKey => indexBatch.del(timeKey))
    return new Promise(resolve => indexBatch.write(resolve))
}

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
const deinidexPage = indexDoc => index.del(indexDoc.id)

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
async function deindexDomain(indexDoc) {
    const existingValue = await singleLookup(indexDoc.domain)
    const newValue = reduceValue(existingValue, indexDoc)

    if (!newValue.size) {
        return index.del(indexDoc.domain)
    }

    return index.put(indexDoc.domain, newValue)
}

/**
 * @param {string} pageId ID of the page to deindex visits, bookmarks, and terms for.
 * @returns {Promise<void>} Resolves when finished, rejects if any deletion error.
 */
async function performDeindexing(pageId) {
    const indexDoc = await singleLookup(pageId)

    if (indexDoc == null) {
        throw new Error(`Page with ID "${pageId}" is not indexed`)
    }

    console.time('deindexing page')
    await Promise.all([
        deinidexPage(indexDoc),
        deindexDomain(indexDoc),
        deindexUrlTerms(indexDoc),
        deindexTitleTerms(indexDoc),
        deindexTerms(indexDoc),
        deindexTimestamps(indexDoc),
        deindexTags(indexDoc),
    ])
    console.timeEnd('deindexing page')
}
