import { bookmarkKeyPrefix } from '../bookmarks'
import { visitKeyPrefix } from 'src/activity-logger'
import index from '.'
import pipeline from './pipeline'
import {
    augmentIndexLookupDoc,
    initSingleLookup,
    initLookupByKeys,
    termRangeLookup,
    idbBatchToPromise,
    fetchExistingPage,
    makeIndexFnConcSafe,
} from './util'
import newIndex from 'src/search-index'

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
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * is concurrency safe as it uses a single queue instance to batch add requests.
 * @param {IndexRequest} req A `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise<void>} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export const addPageConcurrent = req =>
    pipeline(req).then(out => newIndex.addPage(out))

/**
 * @param {IndexRequest} req Note that only the `pageDoc` will be used from the request params to update terms.
 * @returns {Promise<void>} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export const addPageTermsConcurrent = makeIndexFnConcSafe(req =>
    pipeline(req).then(addPageTerms),
)

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

    for (const [timestamp] of timeValuesMap) {
        indexBatch.put(timestamp, { pageId: indexDoc.id })
    }

    return idbBatchToPromise(indexBatch)
}

/**
 * @param {IndexLookupDoc} indexDoc Input doc containing new data to add to current state.
 * @param {IndexLookupDoc} Augmented version of input doc containing new state.
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
              tags: existingDoc.tags,
          }

    const augIndexDoc = augmentIndexLookupDoc(newIndexDoc)
    await index.put(indexDoc.id, augIndexDoc)
    // console.log(await index.get(indexDoc.id))
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
    // Run indexing of page
    console.time('indexing page')
    const augIndexDoc = await indexPage(indexDoc)
    await Promise.all([
        indexDomain(augIndexDoc),
        indexUrlTerms(augIndexDoc),
        indexTitleTerms(augIndexDoc),
        indexTerms(augIndexDoc),
        // Note we are only wanting to index new visits/bookmarks, so passing in the unagumented `indexDoc` here
        indexMetaTimestamps(indexDoc),
    ])
    console.timeEnd('indexing page')
    console.log('indexed', augIndexDoc)
}

/**
 * Updates an indexing indexed page doc with new terms.
 *
 * @param {IndexLookupDoc} indexDoc Contains at least `terms` and `id` props.
 * @returns {Promise<void>}
 * @throws {Error} If `indexDoc.id` has no indexed value.
 */
async function addPageTerms(indexDoc) {
    const existingDoc = await singleLookup(indexDoc.id)

    if (existingDoc == null) {
        throw new Error(`Cannot add terms for unknown page "${indexDoc.id}"`)
    }

    // Update only the page terms
    const augIndexDoc = {
        ...existingDoc,
        terms: new Set([...existingDoc.terms, ...indexDoc.terms]),
    }
    const timer = `indexing page content (${augIndexDoc.terms
        .size} terms): ${indexDoc.id}`

    console.time(timer)
    await Promise.all([
        index.put(indexDoc.id, augIndexDoc),
        indexTerms(augIndexDoc),
    ])
    console.timeEnd(timer)
}

/**
 * Adds a meta (bookmark or visit) entry into specified reverse index doc.
 * NOTE: Assumes the existence of indexed `pageId`.
 *
 * @param {string} pageId ID of page doc to associate with.
 * @param {string} timestampKey Key of timestamp event to add.
 */
async function addTimestamp(pageId, timestampKey) {
    const reverseIndexDoc = await singleLookup(pageId)
    const metaSet = timestampKey.startsWith(visitKeyPrefix)
        ? reverseIndexDoc.visits
        : reverseIndexDoc.bookmarks

    metaSet.add(timestampKey)

    await index.put(pageId, reverseIndexDoc)
}

/**
 * Adds a new meta index (bookmark or visit) entry.
 * NOTE: Assumes the existence of indexed `pageId`.
 *
 * @param {string} pageId ID of page doc to associate with.
 * @param {string} timestampKey Key of timestamp event to add.
 * @param {any} [meta={}] Object of any associated meta data to store with the indexed event value.
 */
export const addTimestampConcurrent = makeIndexFnConcSafe(
    (pageId, timestampKey, meta = {}) =>
        addTimestamp(pageId, timestampKey).then(() =>
            index.put(timestampKey, { pageId, ...meta }),
        ),
)

/**
 * @param {string} timestampId ID of an existing timestamp index value to update.
 * @param {(oldVal: any) => any} updateCb Callback that is passed the existing value to reduce. Returned value gets set as new.
 * @returns {Promise<void>}
 */
async function updateTimestampMeta(timestampId, updateCb) {
    let existingVal = await singleLookup(timestampId)

    if (existingVal == null) {
        throw new Error(
            `No existing value exists for supplied timestamp ID: ${timestampId}`,
        )
    }

    // Handle older-string-baesd timestamp values
    if (typeof existingVal === 'string') {
        existingVal = { pageId: existingVal }
    }

    // Do not allow overwriting of the `pageId` property
    const newVal = { ...updateCb(existingVal), pageId: existingVal.pageId }
    return index.put(timestampId, newVal)
}

export const updateTimestampMetaConcurrent = makeIndexFnConcSafe(
    updateTimestampMeta,
)
