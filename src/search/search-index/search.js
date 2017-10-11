import intersection from 'lodash/intersection'
import pick from 'lodash/fp/pick'

import { structureSearchResult, initLookupByKeys } from './util'

const compareByScore = (a, b) => b.score - a.score

// TODO: If only the page state changes, re-use results from last search
const paginate = (skip, pageSize) => results =>
    results.slice(skip, skip + pageSize)

/**
 * Performs a search based on data supplied in the `query`.
 *
 * @param {IndexQuery} query
 * @param {boolean} [fullDocs=true] Specifies whether to return just the ID or all doc data.
 * @returns {SearchResult[]}
 */
export async function search(
    { offset = 0, pageSize = 10, query },
    { fullDocs = true } = { fullDocs: true },
) {
    const terms = query[0]['AND'].content
    const lookupByKeys = initLookupByKeys({ defaultValue: {} })
    const paginateResults = paginate(offset, pageSize)

    // For each term, do index lookup to grab the associated page IDs value
    const termValues = await lookupByKeys(terms)

    // Exit early if no results
    if (!termValues.length) {
        return termValues
    }

    let mergedTermValues = Object.assign(...termValues)

    // Perform set intersect on each term value key to AND results
    if (termValues.length > 1) {
        const intersectedIds = intersection(...termValues.map(Object.keys))
        mergedTermValues = pick(intersectedIds)(mergedTermValues)
    }

    // Either just return the IDs
    if (!fullDocs) {
        const results = Object.keys(mergedTermValues)
            .map(id => {
                const { latest } = mergedTermValues[id]
                return structureSearchResult({ id }, latest)
            })
            .sort(compareByScore)

        return paginateResults(results)
    }

    // ... or resolve result IDs to their indexed doc data
    const resultDocs = await lookupByKeys(Object.keys(mergedTermValues))

    const results = resultDocs
        .map(doc => {
            const { latest } = mergedTermValues[doc.id]
            return structureSearchResult(doc, latest)
        })
        .sort(compareByScore)

    return paginateResults(results)
}

export async function count(query) {
    // const index = await indexP
    // return Promise.resolve(50)
    // return new Promise((...args) => index.totalHits(query, standardResponse(...args)))
}
