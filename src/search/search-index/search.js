import { structureSearchResult, initLookupByKeys, keyGen } from './util'

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
    const lookupByKeys = initLookupByKeys()
    const paginateResults = paginate(offset, pageSize)

    // For each term, do index lookup to grab the associated page IDs value
    const termValues = await lookupByKeys(terms.map(keyGen.term))

    const containsEmptyTerm = termValues.reduce(
        (acc, curr) => acc || curr == null,
        false,
    )

    // Exit early if no results
    if (!termValues.length || containsEmptyTerm) {
        return []
    }

    const mergedTermValues = new Map(
        termValues.reduce((acc, curr) => [...acc, ...curr], []),
    )

    // Perform intersect of Map on each term value key to AND results
    if (termValues.length > 1) {
        const missingInSomeTermValues = pageId =>
            termValues.some(termValue => !termValue.has(pageId))

        // Perform set difference on pageIds between termValues
        const differedIds = new Set(
            [...mergedTermValues.keys()].filter(missingInSomeTermValues),
        )

        // Delete each of the differed pageIds from the merged Map of term values
        differedIds.forEach(pageId => mergedTermValues.delete(pageId))
    }

    // Either just return the IDs
    if (!fullDocs) {
        const results = []

        for (const [id, value] of mergedTermValues) {
            results.push(structureSearchResult({ id }, value.get('latest')))
        }

        return paginateResults(results.sort(compareByScore))
    }

    // ... or resolve result IDs to their indexed doc data
    const resultDocs = await lookupByKeys([...mergedTermValues.keys()])

    const results = resultDocs
        .map(doc => {
            const latest = mergedTermValues.get(doc.id).get('latest')
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
