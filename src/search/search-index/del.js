import zipObject from 'lodash/fp/zipObject'

import index from './'
import { addConcurrent } from './add'
import { initSingleLookup, initLookupByKeys, extractTerms } from './util'
import { transformMetaDoc } from './transforms'

/**
 * @param {string|Array<string>} pageIds Single ID, or array of IDs, of docs to attempt to delete from the index.
 * @returns Boolean denoting that the delete was successful (else error thrown).
 */
export default async function del(pageIds) {
    if (Array.isArray(pageIds)) {
        for (const pageId of pageIds) {
            await delPage(pageId)
        }
    } else {
        await delPage(pageIds)
    }
}

function reduceTermValue(currTermValue, idToDel) {
    const { [idToDel]: id, ...termValue } = currTermValue

    return termValue
}

async function delPage(pageId) {
    const indexBatch = index.batch()
    const lookupByKeys = initLookupByKeys({ defaultValue: {} })
    const doc = await initSingleLookup()(pageId)

    if (!doc || !doc.content) {
        throw new Error(`Page with ID "${pageId}" is not indexed`)
    }

    // Schedule deletion of indexed page doc
    indexBatch.del(pageId)

    const terms = extractTerms(doc.content)
    const termValues = await lookupByKeys(terms)
    const termValuesDict = zipObject(terms, termValues)

    // Schedule updates of all associated term values
    for (const term in termValuesDict) {
        try {
            const termValue = reduceTermValue(termValuesDict[term], pageId)
            indexBatch.put(term, JSON.stringify(termValue))
        } catch (error) {
            // Serializing issue; skip current
            console.error(error)
        }
    }

    // Run batch ops
    return new Promise(resolve => indexBatch.write(resolve))
}

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
    const existingDoc = await initSingleLookup()(indexDocId) // Get existing doc
    if (!existingDoc) {
        throw new Error(
            'Page associated with timestamp is not recorded in the index',
        )
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
