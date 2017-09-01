import QueryBuilder from './query-builder'
import * as index from './search-index'
import mapResultsToPouchDocs from './map-search-to-pouch'

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

    // Using index results, fetch matching pouch docs
    const results = await index.search(indexQuery)

    // Short-circuit if no results
    if (!results.length) {
        return { docs: [], resultsExhausted: true }
    }

    // If the query is empty, we default to time-based sort, else use search relevance
    const shouldSortByTime = query === ''

    const docs = await mapResultsToPouchDocs(results, { startDate, endDate }, shouldSortByTime)

    return {
        docs,
        resultsExhausted: results.length < limit,
    }
}
