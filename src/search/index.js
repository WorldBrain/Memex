import QueryBuilder from './query-builder'
import { searchConcurrent } from './search-index/search'
import mapResultsToPouchDocs from './map-search-to-pouch'

async function indexSearch({
    query,
    startDate,
    endDate,
    skip = 0,
    limit = 10,
    getTotalCount = false,
    fullDocs = true,
    showOnlyBookmarks = false,
}) {
    query = query.trim() // Don't count whitespace searches

    // Create SI query
    const indexQuery = new QueryBuilder()
        .searchTerm(query)
        .filterTime({ startDate, endDate }, 'bookmark/')
        .filterTime({ startDate, endDate }, 'visit/')
        .skipUntil(skip)
        .limitUntil(limit)
        .bookmarksFilter(showOnlyBookmarks)
        .get()

    // If there is only Bad Terms don't continue
    if (indexQuery.isBadTerm) {
        return {
            docs: [],
            resultsExhausted: true,
            totalCount: getTotalCount ? 0 : undefined,
            isBadTerm: true,
        }
    }
    console.log('DEBUG: query', indexQuery)

    // Get index results, filtering out any unexpectedly structured results
    const { results, totalCount } = await searchConcurrent(indexQuery, {
        count: getTotalCount,
        fullDocs,
    })

    // Short-circuit if no results
    if (!results.length) {
        return {
            docs: [],
            resultsExhausted: true,
            totalCount,
            isBadTerm: false,
        }
    }

    // Match the index results to data docs available in Pouch, consolidating meta docs
    const docs = await mapResultsToPouchDocs(results, { startDate, endDate })

    console.log('DEBUG: final UI results', docs)

    return {
        docs,
        resultsExhausted: docs.length < limit,
        totalCount,
        isBadTerm: false,
    }
}

// Export index interface
export { addPage, addPageConcurrent, put } from './search-index/add'
export { initSingleLookup } from './search-index/util'
export { delPages, delPagesConcurrent, del } from './search-index/del'
export { indexSearch as search }
