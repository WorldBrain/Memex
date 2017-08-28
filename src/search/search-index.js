/* eslint promise/param-names: 0 */
import initSearchIndex from 'search-index'
import stream from 'stream'
import reduce from 'lodash/fp/reduce'
import partition from 'lodash/fp/partition'

import { convertMetaDocId } from 'src/activity-logger'
import db, { normaliseFindResult } from 'src/pouchdb'
import QueryBuilder from './query-builder'
import pipeline from './search-index-pipeline'

const indexOpts = {
    batchSize: 500,
    appendOnly: true,
    indexPath: 'test',
    logLevel: 'info',
    preserveCase: false,
    compositeField: false,
    nGramLength: 1,
    separator: /[|' .,\-|(\n)]+/,
    stopwords: require('stopword').en,
    fieldOptions: {
        visitTimestamps: {
            fieldedSearch: true,
        },
        bookmarkTimestamps: {
            fieldedSearch: true,
        },
        content: {
            fieldedSearch: true,
        },
        url: {
            weight: 10,
            fieldedSearch: true,
            separator: '/', // Not ideal, but will allow the domain name to be searchable
        },
    },
}

const standardResponse = (resolve, reject) =>
    (err, data = true) => err ? reject(err) : resolve(data)

/**
 * Simply maps out the ID of visit or bookmark docs. The ID contains
 * timestamp, which is the only data we want at the moment.
 */
const transformTimeDoc = ({ _id: id }) => id

/**
 * Creates an object based on an array of page docs, indexing them via ID.
 */
const createPagesObject = reduce((result, pageDoc) => ({
    ...result,
    [pageDoc._id]: { ...pipeline(pageDoc), visitTimestamps: [], bookmarkTimestamps: [] },
}), {})


/**
 * Structures page + meta doc relationships for insert into the index. Essentially reverses
 * the relationship from 1 metaDoc -> 1 pageDoc, to 1 pageDoc -> N metaDocs (via an array of IDs).
 * @param {any} docs Object containing arrays of `pageDocs`, `visitDocs`, and `bookmarkDocs`
 * @returns Array of page data ready for insert into index, holding all previously held relationship data.
 */
const structureDocsForIndex = ({ pageDocs, visitDocs, bookmarkDocs }) => {
    // Transform pages to dict of `_id`s to docs, for constant-time lookup
    const pages = createPagesObject(pageDocs)

    // Affords updating the pages dict with bookmark/visit `_id`s/timestamps
    const updatePageTimes = field => metaDoc => {
        if (pages[metaDoc.page._id]) {
            pages[metaDoc.page._id][field].push(metaDoc._id)
        }
    }

    // Attach bookmarks/visits to assoc. page datas
    visitDocs.forEach(updatePageTimes('visitTimestamps'))
    bookmarkDocs.forEach(updatePageTimes('bookmarkTimestamps'))

    // Return now-linked doc values out of ID-indexed dict
    return Object.values(pages)
}


const indexP = new Promise((...args) => initSearchIndex(indexOpts, standardResponse(...args)))

export const instance = () => indexP

export async function addPage({ pageDoc, visitDocs = [], bookmarkDocs = [] }) {
    const index = await indexP

    const visitTimestamps = visitDocs.length ? visitDocs.map(transformTimeDoc) : []
    const bookmarkTimestamps = bookmarkDocs.length ? bookmarkDocs.map(transformTimeDoc) : []

    const input = [{ ...pipeline(pageDoc), visitTimestamps, bookmarkTimestamps }]

    return new Promise((...args) => index.concurrentAdd(indexOpts, input, standardResponse(...args)))
}

export async function addPagesConcurrent({ pageDocs, visitDocs = [], bookmarkDocs = [] }) {
    const index = await indexP
    const input = structureDocsForIndex({ pageDocs, visitDocs, bookmarkDocs })

    return new Promise((...args) => index.concurrentAdd(indexOpts, input, standardResponse(...args)))
}

export async function addPages({ pageDocs, visitDocs = [], bookmarkDocs = [] }) {
    const index = await indexP

    return new Promise((resolve, reject) => {
        const input = structureDocsForIndex({ pageDocs, visitDocs, bookmarkDocs })

        // Set up add pipeline
        const inputStream = new stream.Readable({ objectMode: true })

        inputStream
            .pipe(index.defaultPipeline())
            .pipe(index.add())
            .on('finish', () => resolve(input.length))
            .on('error', reject)

        // Push input onto input stream
        input.forEach(doc => inputStream.push(doc))
        inputStream.push(null) // Signify end of input on Readable
    })
}

/**
 * Returns a function that affords adding either a visit or bookmark to an index.
 * The function should perform the following update, using the associated page doc ID:
 *  - grab the existing index doc matching the page doc ID
 *  - perform update to appropriate timestamp field
 *  - delete the original doc form the index
 *  - add the updated doc into the index
 */
const addTimestamp = field => async ({ _id, page }) => {
    const existingDoc = await get(page._id) // Get existing doc
    if (!existingDoc) {
        throw new Error('Page associated with timestamp is not recorded in the index')
    }

    (existingDoc[field] || []).push(_id) // Perform in-memory update
    await del(page._id) // Delete existing doc
    return add(existingDoc) // Add new updated doc
}

export const addVisit = addTimestamp('visitTimestamps')
export const addBookmark = addTimestamp('bookmarkTimestamps')

/**
 * Returns a function that affords removing either a visit or bookmark from the index.
 * The function should perform the following update, using the associated page doc ID:
 *  - grab the existing index doc matching the page doc ID
 *  - perform update to appropriate timestamp field, removing the existing ID
 *  - delete the original doc form the index
 *  - add the updated doc into the index
 */
const removeTimestamp = field => async ({ _id, page }) => {
    const existingDoc = await get(page._id) // Get existing doc
    if (!existingDoc) {
        throw new Error('Page associated with timestamp is not recorded in the index')
    }

    // Perform in-memory update by removing the timestamp
    const indexToRemove = existingDoc[field].indexOf(_id)
    if (indexToRemove === -1) {
        throw new Error('Associated timestamp is not recorded in the index')
    }
    existingDoc[field] = [
        ...existingDoc[field].slice(0, indexToRemove),
        ...existingDoc[field].slice(indexToRemove + 1),
    ]

    await del(page._id) // Delete existing doc
    return add(existingDoc) // Add new updated doc
}

export const removeVisit = removeTimestamp('visitTimestamps')
export const removeBookmark = removeTimestamp('bookmarkTimestamps')

/**
 * @param {string|Array<string>} ids Single ID, or array of IDs, of docs to attempt to find in the index.
 * @returns A single index doc that matches the supplied ID.
 */
export async function get(ids) {
    const index = await indexP

    // Typeguard on input; handle either array or single
    const isSingle = typeof ids === 'string'
    let found = []

    return new Promise((resolve, reject) =>
        index.get(isSingle ? [ids] : ids)
            .on('data', datum => found.push(datum))
            .on('error', reject)
            .on('end', () => resolve(isSingle ? found[0] : found)))
}

/**
 * @param {string|Array<string>} ids Single ID, or array of IDs, of docs to attempt to delete from the index.
 * @returns Boolean denoting that the delete was successful (else error thrown).
 */
export async function del(ids) {
    const index = await indexP

    // Typeguard on input; make single ID into array if need be
    const toDelete = typeof ids === 'string' ? [ids] : ids

    return new Promise((...args) => index.del(toDelete, standardResponse(...args)))
}

/**
 * @param doc The doc to queue up for adding into the index.
 * @returns Boolean denoting that the add was successful (else error thrown).
 */
export async function add(doc) {
    const index = await indexP
    const input = [doc]

    return new Promise((...args) => index.concurrentAdd(indexOpts, input, standardResponse(...args)))
}

export async function count(query) {
    const index = await indexP

    return new Promise((...args) => index.totalHits(query, standardResponse(...args)))
}

export async function findOne(query) {
    const index = await indexP

    return new Promise((resolve, reject) =>
        index.search(query)
            .on('data', resolve)
            .on('error', reject))
}

export async function find(query) {
    const index = await indexP
    let data = []

    return new Promise((resolve, reject) =>
        index.search(query)
            .on('data', datum => data.push(datum))
            .on('error', reject)
            .on('end', () => resolve(data)))
}

export async function findStream(query) {
    const index = await indexP

    return index.search(query)
}

export async function size() {
    const index = await indexP

    return new Promise((...args) => index.countDocs(standardResponse(...args)))
}

export async function destroy() {
    const index = await indexP

    return new Promise((resolve, reject) =>
        index.flush(err =>
            err ? reject(err) : resolve('index destroyed')))
}

// TODO: clean all this up; should be moved to wherever is most relevant (src/pouchdb ?)

// Gets all the "ok" docs from Pouch bulk result, returning them as an array
const bulkResultsToArray = ({ results }) => results
    .map(res => res.docs)
    .map(list => list.filter(doc => doc.ok))
    .filter(list => list.length)
    .map(list => list[0].ok)

const getTimestampFromId = id => +convertMetaDocId(id).timestamp

// Allows easy "flattening" of index results to just be left with the Pouch doc IDs
const extractDocIdsFromIndexResult = indexResult => indexResult
    .map(({ document: doc }) => [doc.id, ...doc.bookmarkTimestamps, ...doc.visitTimestamps]) // Grab IDs from doc
    .reduce((prev, curr) => [...prev, ...curr], []) // Flatten everything
    .map(id => ({ id })) // Map them into appropriate shape for pouch bulkGet query

const getLatestVisit = (visitIds = []) => {
    const sorted = visitIds.sort()
    return sorted.length ? sorted[0] : ''
}

// TODO: Move this to own module and modularise the code
export async function filterVisitsByQuery({
    query,
    startDate,
    endDate,
    skip,
    limit = 10,
    pagesOnly = false,
}) {
    const indexQuery = new QueryBuilder()
        .searchTerm(query || '*') // Search by wildcard by default
        .startDate(startDate)
        .endDate(endDate)
        .skipUntil(skip || undefined)
        .limit(limit || 10)
        .get()
    console.log(indexQuery) // DEBUG

    // Using index results, fetch matching pouch docs
    const results = await find(indexQuery)

    // Short-circuit if no results
    if (!results.length) {
        return { rows: [], resultsExhausted: true }
    }

    // Ignore meta docs if not wanted
    if (pagesOnly) {
        const resultDocs = results.map(result => ({
            id: result.document.id,
            latestVisit: getLatestVisit(result.document.visitTimestamps),
        }))
        const bulkRes = await db.bulkGet({ docs: resultDocs })
        // TODO: Hacky as hell; improve this
        const docs = bulkResultsToArray(bulkRes).map(doc => {
            const matchingResult = resultDocs.find(result => result.id === doc._id)
            return { ...doc, latestVisit: getTimestampFromId(matchingResult.latestVisit) }
        })

        return {
            ...normaliseFindResult({ docs }),
            resultsExhausted: results.length < limit,
        }
    }

    // Using the index result, grab doc IDs and then bulk get them from Pouch
    const docIds = extractDocIdsFromIndexResult(results)
    const bulkRes = await db.bulkGet({ docs: docIds })
    const docs = bulkResultsToArray(bulkRes)

    // Parition into meta and page docs
    let [pageDocs, metaDocs] = partition(({ _id }) => _id.startsWith('page/'))(docs)

    // Put pageDocs into an easy-lookup dictionary
    pageDocs = reduce((dict, pageDoc) => ({ ...dict, [pageDoc._id]: pageDoc }), {})(pageDocs)

    // Insert page docs into the relevant meta docs
    metaDocs = metaDocs.map(doc => {
        doc.page = pageDocs[doc.page._id]
        return doc
    })

    // Perform sort if default query
    if (!query) {
        metaDocs = metaDocs
            .sort((a, b) => getTimestampFromId(a._id) < getTimestampFromId(b._id))
    }

    return {
        ...normaliseFindResult({ docs: metaDocs }),
        resultsExhausted: results.length < limit,
    }
}
