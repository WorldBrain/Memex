import zip from 'lodash/fp/zip'

import index from './'
import { initSingleLookup, initLookupByKeys } from './util'

/**
 * @param {string|Array<string>} pageIds Single ID, or array of IDs, of docs to attempt to delete from the index.
 * @returns Boolean denoting that the delete was successful (else error thrown).
 */
export default async function del(pageIds) {
    if (Array.isArray(pageIds)) {
        for (const pageId of pageIds) {
            await performDeindexing(pageId)
        }
    } else {
        await performDeindexing(pageIds)
    }
}

function reduceValue(value, id) {
    if (value == null) {
        return new Map()
    }
    value.delete(id)
    return value
}

async function deindex(id, indexedKeys) {
    const indexBatch = index.batch()

    const indexedValues = await initLookupByKeys()(indexedKeys)
    const indexedMap = new Map(zip(indexedKeys, indexedValues))

    // Schedule updates of all associated term values
    for (const [key, currValue] of indexedMap) {
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

async function performDeindexing(pageId) {
    const indexDoc = await initSingleLookup()(pageId)

    if (!indexDoc || !indexDoc.content) {
        throw new Error(`Page with ID "${pageId}" is not indexed`)
    }

    console.time('deindexing page')
    await deinidexPage(indexDoc)
    console.timeEnd('deindexing page')

    console.time('deindexing terms')
    await deindexTerms(indexDoc)
    console.timeEnd('deindexing terms')

    console.time('deindexing times')
    await deindexTimestamps(indexDoc)
    console.timeEnd('deindexing times')
}
