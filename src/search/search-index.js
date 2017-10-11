/* eslint promise/param-names: 0 */
import initSearchIndex from 'search-index'
import stream from 'stream'
import stopword from 'stopword'
import leveljs from 'level-js'
import uniq from 'lodash/uniq'
import after from 'lodash/after'
import flattenDeep from 'lodash/flattenDeep'

import pipeline from './search-index-pipeline'
import { convertMetaDocId } from 'src/activity-logger'
import { RESULT_TYPES } from 'src/overview/constants'

const indexOpts = {
    batchSize: 500,
    appendOnly: false,
    indexPath: 'worldbrain-index',
    logLevel: 'info',
    preserveCase: false,
    compositeField: false,
    nGramLength: 1,
    // separator: /[|' .,\-|(\n)]+/,
    stopwords: stopword.en,
    fieldOptions: {
        // The `domain.tld(.cctld)` data from a page's URL
        // Currently used to afford `domain.tld(.cctld)` search in our queries
        // Should never need to tokenize, but put forward-slash separator incase preproecssing fails for whatever reason
        // (then domain search can still happen)
        domain: {
            weight: 40,
            fieldedSearch: true,
            separator: '/',
        },
        // Page title text; occasionally empty
        title: {
            weight: 30,
            fieldedSearch: true,
        },
        // Page URL tokenized by forward slashes; normalized slightly to remove protocol and leading `www.`
        url: {
            weight: 20,
            fieldedSearch: true,
            separator: '/',
        },
        // Sorted arrays of UNIX epoch timestamps; latest at end.
        // Currently used to afford time filtering; updates on relevant meta event
        visits: { fieldedSearch: true },
        bookmarks: { fieldedSearch: true },
        // The bulk of page content; processed from `document.innerHTML`
        content: { fieldedSearch: true },
        // UNIX epoch timestamp; should always be the same as last element of `visits` or `bookmarks` array, depending on which is later.
        // Currently used for sorting when there are no text search parameters defined; updates on meta events
        latest: {
            sortable: true,
        },
        // Denotes the type (currently 'visit' or 'bookmark') of the latest meta event performed on page
        // Currently used to afford differientiation (mainly in UI); updates on meta events
        type: {
            searchable: false,
            fieldedSearch: false,
        },
    },
}

const standardResponse = (resolve, reject) => (err, data = true) =>
    err ? reject(err) : resolve(data)

// Simply extracts the timestamp component out the ID of a visit or bookmark doc,
//  which is the only data we want at the moment.
const transformMetaDoc = doc => convertMetaDocId(doc._id).timestamp

/**
 * NOTE: Assumes sorted arrays, last index containing latest.
 * @param {Array<string>} visits Sorted array of UNIX timestamp strings.
 * @param {Array<string>} bookmarks Sorted array of UNIX timestamp strings.
 * @returns {any} Object containing:
 *  - `latest`: latest UNIX timestamp of all params
 *  - `type`: currently either `bookmark` or `visit` to allow distinguishing the type later.
 */
const getLatestMeta = (visits, bookmarks) => {
    const numVisits = visits.length
    const numBookmarks = bookmarks.length

    if (numVisits && numBookmarks) {
        // Both arrays have timestamps
        return visits[numVisits - 1] > bookmarks[numBookmarks - 1]
            ? { latest: visits[numVisits - 1], type: RESULT_TYPES.VISIT }
            : {
                  latest: bookmarks[numBookmarks - 1],
                  type: RESULT_TYPES.BOOKMARK,
              }
    } else if (numBookmarks) {
        // Only bookmark array has timestamps
        return {
            latest: bookmarks[numBookmarks - 1],
            type: RESULT_TYPES.BOOKMARK,
        }
    } else {
        // Only visit array has timestamps
        return { latest: visits[numVisits - 1], type: RESULT_TYPES.VISIT }
    }
}

// Groups input docs into standard index doc structure
const transformPageAndMetaDocs = ({
    pageDoc,
    visitDocs = [],
    bookmarkDocs = [],
}) => {
    const visits = visitDocs.map(transformMetaDoc)
    const bookmarks = bookmarkDocs.map(transformMetaDoc)

    return {
        ...pipeline(pageDoc),
        ...getLatestMeta(visits, bookmarks),
        visits,
        bookmarks,
    }
}

async function initRawIndex(cb) {
    const db = leveljs('worldbrain-terms')
    db.open(err => {
        if (err) return cb(err)
        return cb(null, db)
    })
}

// Wraps instance creation in a Promise for use in async interface methods
// const indexP = new Promise((...args) => initSearchIndex(indexOpts, standardResponse(...args)))
const indexP = new Promise((...args) => initRawIndex(standardResponse(...args)))

/**
 * @param doc The doc to queue up for adding into the index.
 * @returns Boolean denoting that the add was successful (else error thrown).
 */
async function addConcurrent(doc) {
    const input = [doc]
    console.log('addConcurrent', doc)

    return new Promise((...args) => {
        const done = after(input.length, standardResponse(...args))
        input.forEach(page => addPageRaw(page, done))
    })
}

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * uses the concurrency-safe index add method.
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

    // return await addConcurrent(indexDoc)
}

/**
 * Adds a new page doc + any associated visit/bookmark docs to the index. This method
 * is *NOT* concurrency safe.
 * @param {any} Object containing a `pageDoc` (required) and optionally any associated `visitDocs` and `bookmarkDocs`.
 * @returns {Promise} Promise resolving when indexing is complete, or rejecting for any index errors.
 */
export async function addPage({ pageDoc, visitDocs = [], bookmarkDocs = [] }) {
    const index = await indexP

    const indexDoc = transformPageAndMetaDocs({
        pageDoc,
        visitDocs,
        bookmarkDocs,
    })
    console.log('adding page', indexDoc)

    return new Promise((...args) =>
        addPageRaw(indexDoc, standardResponse(...args)),
    )
    //
    // return new Promise((resolve, reject) => {
    //     // Set up add pipeline
    //     const inputStream = new stream.Readable({ objectMode: true })
    //     inputStream
    //         .pipe(index.defaultPipeline())
    //         .pipe(index.add())
    //         .on('finish', resolve)
    //         .on('error', reject)
    //
    //     // Push index doc onto stream + null to signify end-of-stream
    //     inputStream.push(indexDoc)
    //     inputStream.push(null)
    // })
}

function getTerms(content) {
    return uniq(content.split(' ').map(term => term.toLowerCase()))
}

async function addPageRaw(indexDoc) {
    console.log('ADDING PAGE RAW')
    const index = await indexP
    const id = indexDoc.id
    if (!indexDoc.content && !indexDoc.title) {
        return new Promise.resolve()
    }

    // extract terms from the document and add the page ID
    // to the array for each term
    const terms = getTerms(indexDoc.content + ' ' + indexDoc.title)

    const addterms = (resolve, reject) => {
        try {
            const done = after(terms.length + 1, resolve)
            index.put(id, JSON.stringify(indexDoc), done)

            terms.forEach(term => {
                index.get(term, (err, value) => {
                    let newvalue
                    if (!value || err) {
                        newvalue = [id]
                    } else {
                        const docids = JSON.parse(value)
                        docids.push(id)
                        newvalue = uniq(docids)
                    }

                    index.put(term, JSON.stringify(newvalue), done)
                })
            })
        } catch (err) {
            reject(err)
        }
    }

    return new Promise(addterms)
}

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
    const existingDoc = await get(indexDocId) // Get existing indexed doc
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
    const existingDoc = await get(indexDocId) // Get existing doc
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

// Below are mostly standard Promise wrappers around search-index stream-based methods

/**
 * @param {string|Array<string>} ids Single ID, or array of IDs, of docs to attempt to find in the index.
 * @returns A single index doc that matches the supplied ID.
 */
export async function get(ids) {
    const index = await indexP

    // Typeguard on input; handle either array or single
    const isSingle = typeof ids === 'string'
    const found = []

    return new Promise((resolve, reject) => {
        return resolve() // TODO: remove
        index
            .get(isSingle ? [ids] : ids)
            .on('data', datum => found.push(datum))
            .on('error', reject)
            .on('end', () => resolve(isSingle ? found[0] : found))
    })
}

/**
 * @param {string|Array<string>} ids Single ID, or array of IDs, of docs to attempt to delete from the index.
 * @returns Boolean denoting that the delete was successful (else error thrown).
 */
export async function del(ids) {
    const index = await indexP

    // Typeguard on input; make single ID into array if need be
    const toDelete = typeof ids === 'string' ? [ids] : ids

    return new Promise((...args) =>
        index.del(toDelete, standardResponse(...args)),
    )
}

export const instance = () => indexP

export async function count(query) {
    const index = await indexP

    // return Promise.resolve(50)

    // return new Promise((...args) => index.totalHits(query, standardResponse(...args)))
}

// Batches stream results to be all returned in Promise resolution.
export async function search(query) {
    const index = await indexP
    const data = []

    console.log('QUERY', query)
    const terms = query.query[0]['AND'].content

    const dosearch = (resolve, reject) => {
        const done = after(terms.length, () => {
            // TODO: to start scoring, count occurrences insted of doing uniq
            const results = uniq(flattenDeep(data))

            console.log('RESULTS', results)

            const fulldocs = []
            const fulldocsdone = after(results.length, () => resolve(fulldocs))

            results.forEach(page => {
                index.get(page, (err, value) => {
                    if (err) {
                        console.log('could not find page', page)
                        return reject(err)
                    }

                    const fulldoc = JSON.parse(value)
                    fulldocs.push({
                        id: fulldoc.id,
                        document: fulldoc,
                        score: 1.0,
                    })
                    fulldocsdone()
                })
            })
        })

        terms.forEach(term => {
            index.get(term, (err, value) => {
                if (err) return done()

                const docs = JSON.parse(value)
                data.push(docs)

                done()
            })
        })
    }

    return new Promise(dosearch)
}

// All commented out functions below are unused

// export async function categorize(query) {
//     const index = await indexP
//     const data = []
//
//     return new Promise((resolve, reject) =>
//         index.categorize(query)
//             .on('data', datum => data.push(datum))
//             .on('error', reject)
//             .on('end', () => resolve(data)))
// }
//
// export async function buckets(query) {
//     const index = await indexP
//     const data = []
//
//     return new Promise((resolve, reject) =>
//         index.buckets(query)
//             .on('data', datum => data.push(datum))
//             .on('error', reject)
//             .on('end', () => resolve(data)))
// }
//
// // Resolves to the stream from search-index's `.search`.
// export async function searchStream(query) {
//     const index = await indexP
//
//     return index.search(query)
// }

export async function size() {
    const index = await indexP

    return new Promise((...args) => index.countDocs(standardResponse(...args)))
}

export async function destroy() {
    const index = await indexP

    return new Promise((resolve, reject) =>
        index.flush(err => (err ? reject(err) : resolve('index destroyed'))),
    )
}
