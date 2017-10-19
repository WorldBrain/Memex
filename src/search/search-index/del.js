import index, { indexQueue } from '.'
import { initSingleLookup, initLookupByKeys } from './util'

/**
 * Deletes all indexed data associated with given pages or page IDs. This method is **not**
 *  concurrency-safe.
 * @param {string|Array<string>} pageIds Single ID, or array of IDs, of docs to attempt to delete from the index.
 * @returns {Promise<void>}
 */
export async function delPages(pageIds) {
    if (Array.isArray(pageIds)) {
        for (const pageId of pageIds) {
            await performDeindexing(pageId)
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
    indexQueue.push(() => delPages(pageIds))

function reduceValue(value, id) {
    if (value == null) {
        return new Map()
    }
    value.delete(id)
    return value
}

/**
 * For an array of `keys` will remove the index entry for `id` under each value.
 *
 * @param {string} id ID of the page to remove from each key.
 * @param {string[]} indexedKeys Array of keys to update.
 * @returns {Promise<void>} Reslves when all updates finished.
 */
async function deindex(id, indexedKeys) {
    const indexBatch = index.batch()

    const indexedValuesMap = await initLookupByKeys()(indexedKeys)

    // Schedule updates of all associated term values
    for (const [key, currValue] of indexedValuesMap) {
        try {
            const newValue = reduceValue(currValue, id)

            // If reduces to empty obj delete KVP, else update
            if (!newValue.size) {
                indexBatch.del(key)
            } else {
                indexBatch.put(key, newValue)
            }
        } catch (error) {
            // skip current
            console.error(error)
        }
    }

    return new Promise(resolve => indexBatch.write(resolve))
}

const deinidexPage = indexDoc => index.del(indexDoc.id)

const deindexTerms = indexDoc => deindex(indexDoc.id, [...indexDoc.terms])

const deindexTimestamps = indexDoc =>
    deindex(indexDoc.id, [...indexDoc.bookmarks, ...indexDoc.visits])

/**
 * @param {string} pageId ID of the page to deindex visits, bookmarks, and terms for.
 * @returns {Promise<void>} Resolves when finished, rejects if any deletion error.
 */
async function performDeindexing(pageId) {
    const indexDoc = await initSingleLookup()(pageId)

    if (!indexDoc || !indexDoc.content) {
        throw new Error(`Page with ID "${pageId}" is not indexed`)
    }

    console.time('deindexing page')
    await Promise.all([
        deinidexPage(indexDoc),
        deindexTerms(indexDoc),
        deindexTimestamps(indexDoc),
    ])
    console.timeEnd('deindexing page')
}
