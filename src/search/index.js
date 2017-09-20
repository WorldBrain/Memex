import QueryBuilder from './query-builder'
import * as index from './search-index'
import mapResultsToPouchDocs from './map-search-to-pouch'

/**
 * Results should always contain a `document` key containing the indexed doc.
 * In some special cases (if something is being removed, but t hasn't finished yet),
 * this could be `undefined`. May add more filters here if any other cases are encountered.
 */
const filterBadlyStructuredResults = results =>
    results.filter(result => result.document != null)

export default async function indexSearch({
    query,
    startDate,
    endDate,
    skip,
    limit = 10,
}) {
    query = query.trim() // Don't count whitespace searches

    // Create SI query
    const indexQuery = new QueryBuilder()
        .searchTerm(query || '*') // Search by wildcard by default
        .startDate(startDate)
        .endDate(endDate)
        .skipUntil(skip || undefined)
        .limit(limit || 10)
        .get()

    // Don't continue if there is no content in indexQuery
    if (indexQuery.query[0].AND.content.length === 0 || indexQuery.query[1].AND.content === 0) {
        return { docs: [], resultsExhausted: false, isBadTerm: true,  }
    }

    // Get index results, filtering out any unexpectedly structured results
    let results = await index.search(indexQuery)
    results = filterBadlyStructuredResults(results)

    // Short-circuit if no results
    if (!results.length) {
        
        return { docs: [], resultsExhausted: true, isBadTerm: false}
    }

    // If the query is empty, we default to time-based sort, else use search relevance
    const shouldSortByTime = query === ''

    // Match the index results to data docs available in Pouch, consolidating meta docs
    const docs = await mapResultsToPouchDocs(results, { startDate, endDate }, shouldSortByTime)
    return {
        docs,
        resultsExhausted: results.length < limit,
        isBadTerm: false
    }
}
