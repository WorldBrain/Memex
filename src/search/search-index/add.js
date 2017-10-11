import { RESULT_TYPES } from 'src/overview/constants'
import PromiseBatcher from 'src/util/promise-batcher'
import index, { DEFAULT_TERM_SEPARATOR } from './'
import { transformPageAndMetaDocs, transformMetaDoc } from './transforms'
import { initSingleLookup, extractTerms } from './util'
import del from './del'

/**
 * @param doc The doc to queue up for adding into the index.
 * @returns Boolean denoting that the add was successful (else error thrown).
 */
export async function addConcurrent(doc) {
    const input = [doc]
    console.log('addConcurrent', doc)

    for (const page of input) {
        await addPageRaw(page)
    }
}

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * uses the concurrency-safe index add method.
 * // TODO: Reimplement
 * @param {any} Object containing a `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export async function addPageConcurrent({
    pageDoc,
    visitDocs = [],
    bookmarkDocs = [],
}) {
    const indexDoc = transformPageAndMetaDocs({
        pageDoc,
        visitDocs,
        bookmarkDocs,
    })
    console.log('adding page concurrent', indexDoc)

    return await addPageRaw(indexDoc)
}

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * is *NOT* concurrency safe.
 * @param {any} Object containing a `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export const addPage = ({ pageDoc, visitDocs = [], bookmarkDocs = [] }) =>
    addPageRaw(
        transformPageAndMetaDocs({
            pageDoc,
            visitDocs,
            bookmarkDocs,
        }),
    )

const createTermValue = indexDoc => ({
    [indexDoc.id]: {
        latest: indexDoc.latest,
    },
})

const initReduceTermValue = indexDoc => currTermValue => {
    const newTermValue = createTermValue(indexDoc)

    // If term not indexed, use new one...
    if (currTermValue == null) {
        return newTermValue
    }

    // ... else update existing with new
    return {
        ...currTermValue,
        ...newTermValue,
    }
}

const addPageRaw = (indexDoc, termSeparator = DEFAULT_TERM_SEPARATOR) =>
    new Promise(async (resolve, reject) => {
        console.log('ADDING PAGE RAW')
        console.log(indexDoc)

        if (!indexDoc.content) {
            return Promise.resolve()
        }

        const reduceTermValue = initReduceTermValue(indexDoc)

        try {
            await index.put(indexDoc.id, JSON.stringify(indexDoc))

            const terms = extractTerms(indexDoc.content, termSeparator)

            const batch = new PromiseBatcher({
                inputBatchCallback: () => Promise.resolve(terms),
                processingCallback: initSingleLookup(),
                concurrency: 5,
                observer: {
                    next: ({ input, output }) =>
                        index.put(
                            input,
                            JSON.stringify(reduceTermValue(output)),
                        ),
                    complete: resolve,
                    error: console.error,
                },
            })

            batch.start()
        } catch (err) {
            reject(err)
        }
    })

/**
 * Returns a function that affords adding either a visit or bookmark to an index.
 * The function should perform the following update, using the associated page doc ID:
 *  - grab the existing index doc matching the page doc ID
 *  - perform update to appropriate timestamp field, by APPENDING new timestamp to field + `latest` (sort) field
 *  - delete the original doc form the index
 *  - add the updated doc into the index
 * NOTE: this appends the timestamp extracted from the given metaDoc, hence to maintain an
 * order, this should generally only get called on new visits/bookmark events.
 */
const addTimestamp = field => async metaDoc => {
    const indexDocId = metaDoc.page._id // Index docs share ID with corresponding pouch page doc
    const existingDoc = await initSingleLookup()(indexDocId) // Get existing indexed doc
    if (!existingDoc) {
        throw new Error(
            'Page associated with timestamp is not recorded in the index',
        )
    }

    const newTimestamp = transformMetaDoc(metaDoc)

    // This can be done better; now works becuase we have only 2 types
    existingDoc.type = metaDoc._id.startsWith('visit/')
        ? RESULT_TYPES.VISIT
        : RESULT_TYPES.BOOKMARK

    // Perform in-memory updates of timestamp array + "latest"/sort field
    existingDoc.latest = newTimestamp
    existingDoc[field] = [...(existingDoc[field] || []), newTimestamp]

    await del(indexDocId) // Delete existing doc
    return addConcurrent(existingDoc) // Add new updated doc
}

export const addVisit = addTimestamp('visits')
export const addBookmark = addTimestamp('bookmarks')
