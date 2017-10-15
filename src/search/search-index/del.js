import zipObject from 'lodash/fp/zipObject'

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

const initReduceTermValue = indexDoc => ({ [indexDoc.id]: id, ...termValue }) =>
    termValue

const initReduceTimestampValue = indexDoc => currValue => {
    if (currValue == null) {
        return currValue
    }
    currValue.delete(indexDoc.id)
    return currValue
}

const deindexTerms = async indexDoc => {
    const indexBatch = index.batch()

    const reduceTermValue = initReduceTermValue(indexDoc)
    const terms = [...indexDoc.terms]
    const termValues = await initLookupByKeys({ defaultValue: {} })(terms)
    const termValuesDict = zipObject(terms, termValues)

    // Schedule updates of all associated term values
    for (const term in termValuesDict) {
        try {
            const termValue = reduceTermValue(termValuesDict[term])

            // If reduces to empty obj delete KVP, else update
            if (!Object.keys(termValue).length) {
                indexBatch.del(term)
            } else {
                indexBatch.put(term, termValue)
            }
        } catch (error) {
            // skip current
            console.error(error)
        }
    }

    return new Promise(resolve => indexBatch.write(resolve))
}

const deindexTimestamps = async indexDoc => {
    const indexBatch = index.batch()

    const reduceTimestampValue = initReduceTimestampValue(indexDoc)
    const timestamps = [...indexDoc.bookmarks, ...indexDoc.visits]
    const timestampValues = await initLookupByKeys()(timestamps)
    const timestampValuesDict = zipObject(timestamps, timestampValues)

    // Schedule updates of all associated timestamp values
    for (const timestamp in timestampValuesDict) {
        try {
            const timestampValue = reduceTimestampValue(
                timestampValuesDict[timestamp],
            )

            // If reduces to null delete KVP, else update
            if (timestampValue == null || !timestampValue.size) {
                indexBatch.del(timestamp)
            } else {
                indexBatch.put(timestamp, timestampValue)
            }
        } catch (error) {
            // Skip current
            console.error(error)
        }
    }

    return new Promise(resolve => indexBatch.write(resolve))
}

const deinidexPage = indexDoc => index.del(indexDoc.id)

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
