import reduce from 'lodash/fp/reduce'
import partition from 'lodash/fp/partition'

import db, { normaliseFindResult } from 'src/pouchdb'
import { convertMetaDocId } from 'src/activity-logger'
import QueryBuilder from './query-builder'
import * as index from './search-index'

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

export default async function indexSearch({
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
    const results = await index.find(indexQuery)

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
