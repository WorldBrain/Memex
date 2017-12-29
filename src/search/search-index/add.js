import { bookmarkKeyPrefix } from 'src/bookmarks'
import index, { indexQueue } from '.'
import pipeline from './pipeline'
import {
    augmentIndexLookupDoc,
    initSingleLookup,
    initLookupByKeys,
    termRangeLookup,
    idbBatchToPromise,
    fetchExistingPage,
    keyGen,
} from './util'

// Used to decide whether or not to do a range lookup for terms (if # terms gt) or N single lookups
const termsSizeLimit = 3000
const lookupByKeys = initLookupByKeys()
const singleLookup = initSingleLookup()

/**
 * @typedef IndexTermValue
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

export const put = (key, val) => index.put(key, val)

/**
 * @param {string} pageId ID of existing page to associate tags with.
 * @param {string[]} tags Array of tags to associate with page.
 * @returns {Promise<void>}
 */
async function addTags(pageId, tags) {
    const reverseIndexDoc = await fetchExistingPage(pageId)

    // Init tags Set if not present
    if (reverseIndexDoc.tags == null) {
        reverseIndexDoc.tags = new Set()
    }

    // Convert all input tags into tags index keys
    const keyedTags = tags.map(keyGen.tag)

    // Add all tag keys to reverse index doc
    keyedTags.forEach(tagKey => reverseIndexDoc.tags.add(tagKey))

    // Value entry to add to tags index Map value
    const indexEntry = [pageId, { latest: reverseIndexDoc.latest }]

    // Add entries to tags index + update reverse index doc
    return await Promise.all([
        ...keyedTags.map(async tagKey => {
            let value = await singleLookup(tagKey)

            if (value != null) {
                value.set(...indexEntry) // Update existing tag key
            } else {
                value = new Map([indexEntry]) // Make new Map value for non-existent tag key
            }
            return await index.put(tagKey, value)
        }),
        index.put(pageId, reverseIndexDoc), // Also update reverse index doc
    ])
}

/**
 * Concurrency-safe (via index queue) wrapper around `addTags`.
 */
export const addTagsConcurrent = (...args) =>
    new Promise((resolve, reject) =>
        indexQueue.push(() =>
            addTags(...args)
                .then(resolve)
                .catch(reject),
        ),
    )

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * is *NOT* concurrency safe.
 * @param {IndexRequest} req A `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise<void>} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export const addPage = req => performIndexing(pipeline(req))

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * is concurrency safe as it uses a single queue instance to batch add requests.
 * @param {IndexRequest} req A `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise<void>} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export const addPageConcurrent = req =>
    new Promise((resolve, reject) => {
        const indexDoc = pipeline(req).catch(reject)

        indexQueue.push(() =>
            performIndexing(indexDoc)
                .then(resolve)
                .catch(reject),
        )
    })

/**
 * @param {string} pageId ID/key of document to associate new bookmark entry with.
 * @param {number|string} [timestamp=Date.now()]
 * @throws {Error} Error thrown when `pageId` param does not correspond to existing document (or any other
 *  standard indexing-related Error encountered during updates).
 */
export const addBookmarkConcurrent = (pageId, timestamp = Date.now()) =>
    new Promise((resolve, reject) =>
        indexQueue.push(() =>
            addBookmark(pageId)
                .then(resolve)
                .catch(reject),
        ),
    )

/**
 * @param {string} pageId ID/key of document to associate new bookmark entry with.
 * @param {number|string} [timestamp=Date.now()]
 * @throws {Error} Error thrown when `pageId` param does not correspond to existing document (or any other
 *  standard indexing-related Error encountered during updates).
 */
async function addBookmark(pageId, timestamp = Date.now()) {
    const reverseIndexDoc = await fetchExistingPage(pageId)

    const bookmarkKey = `${bookmarkKeyPrefix}${timestamp}`

    // Add new entry to bookmarks index
    await index.put(bookmarkKey, pageId)

    // Add bookmarks index key to reverse page doc and update index entry
    reverseIndexDoc.bookmarks.add(bookmarkKey)
    await index.put(pageId, reverseIndexDoc)
}

/**
 * @param {IndexTermValue} currTermVal
 * @param {IndexLookupDoc} indexDoc
 * @returns {IndexTermValue} Updated `currTermVal` with new entry for `indexDoc`.
 */
function reduceTermValue(currTermVal, indexDoc) {
    if (currTermVal == null) {
        return new Map([[indexDoc.id, { latest: indexDoc.latest }]])
    }
    currTermVal.set(indexDoc.id, { latest: indexDoc.latest })
    return currTermVal
}

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
const initIndexTerms = (termsField, termKey) => async indexDoc => {
    const indexBatch = index.batch()
    const termsSet = indexDoc[termsField]

    if (!termsSet.size) {
        return Promise.resolve()
    }

    const termValuesMap = await (termsSet.size > termsSizeLimit
        ? termRangeLookup(termKey, termsSet)
        : lookupByKeys([...termsSet]))

    for (const [term, currTermVal] of termValuesMap) {
        const termValue = reduceTermValue(currTermVal, indexDoc)
        indexBatch.put(term, termValue)
    }

    return idbBatchToPromise(indexBatch)
}

const indexTerms = initIndexTerms('terms', 'term/')
const indexUrlTerms = initIndexTerms('urlTerms', 'url/')
const indexTitleTerms = initIndexTerms('titleTerms', 'title/')

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
async function indexMetaTimestamps(indexDoc) {
    const indexBatch = index.batch()
    const timeValuesMap = await lookupByKeys([
        ...indexDoc.bookmarks,
        ...indexDoc.visits,
    ])

    for (const [timestamp, existing] of timeValuesMap) {
        if (existing !== indexDoc.id) {
            indexBatch.put(timestamp, indexDoc.id)
        }
    }

    return idbBatchToPromise(indexBatch)
}

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
async function indexPage(indexDoc) {
    const existingDoc = await singleLookup(indexDoc.id)

    // Ensure the terms and meta timestamps get merged with existing
    const newIndexDoc = !existingDoc
        ? indexDoc
        : {
              ...indexDoc,
              terms: new Set([...existingDoc.terms, ...indexDoc.terms]),
              titleTerms: new Set([
                  ...existingDoc.titleTerms,
                  ...indexDoc.titleTerms,
              ]),
              visits: new Set([...existingDoc.visits, ...indexDoc.visits]),
              bookmarks: new Set([
                  ...existingDoc.bookmarks,
                  ...indexDoc.bookmarks,
              ]),
          }

    const augIndexDoc = augmentIndexLookupDoc(newIndexDoc)
    await index.put(indexDoc.id, augIndexDoc)
    return augIndexDoc
}

/**
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
async function indexDomain(indexDoc) {
    const existingValue = await singleLookup(indexDoc.domain)

    return index.put(indexDoc.domain, reduceTermValue(existingValue, indexDoc))
}

/**
 * Runs all indexing logic on the page data concurrently for different types
 * as they all live on separate indexes.
 * @param {IndexLookupDoc} indexDoc
 * @returns {Promise<void>}
 */
async function performIndexing(indexDoc) {
    indexDoc = await indexDoc

    if (!indexDoc.terms.size) {
        return
    }

    try {
        // Run indexing of page
        console.time('indexing page')
        const augIndexDoc = await indexPage(indexDoc)
        await Promise.all([
            indexDomain(augIndexDoc),
            indexUrlTerms(augIndexDoc),
            indexTitleTerms(augIndexDoc),
            indexTerms(augIndexDoc),
            indexMetaTimestamps(augIndexDoc),
        ])
        console.timeEnd('indexing page')
        console.log('indexed', augIndexDoc)
    } catch (err) {
        console.error(err)
    }
}

/**
 * Adds a meta (bookmark or visit) entry into specified reverse index doc.
 * NOTE: Assumes the existence of indexed `pageId`.
 *
 * @param {'bookmark'|'visit'} type Type of meta event.
 * @param {string} pageId ID of page doc to associate with.
 * @param {string} timestamp Timestamp of meta event.

 */
async function addMetaToReversePage(type, pageId, timestamp) {
    const reverseIndexDoc = await singleLookup(pageId)
    if (type === 'visit') {
        reverseIndexDoc.visits.add('visit/' + timestamp)
    } else {
        reverseIndexDoc.bookmarks.add('bookmark/' + timestamp)
    }
    await index.put(pageId, reverseIndexDoc)
}

/**
 * Adds a new meta index (bookmark or visit) entry.
 * NOTE: Assumes the existence of indexed `pageId`.
 *
 * @param {'bookmark'|'visit'} type Type of meta event.
 * @param {string} timestamp Timestamp of meta event.
 * @param {string} pageId ID of page doc to associate with.
 */
export const addMetaConcurrent = (type, timestamp, pageId) =>
    new Promise((resolve, reject) =>
        indexQueue.push(() => {
            addMetaToReversePage(type, pageId, timestamp)
                .then(() => index.put(`${type}/${timestamp}`, pageId))
                .then(resolve)
                .catch(reject)
        }),
    )
