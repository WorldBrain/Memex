import QueryBuilder from './query-builder'
import { searchConcurrent } from './search-index/search'
import mapResultsToPouchDocs from './map-search-to-pouch'
import NewSearchTriggered from '../analytics/internal/searches'

async function indexSearch({
    query,
    startDate,
    endDate,
    tags = [],
    domains = [],
    skip = 0,
    limit = 10,
    getTotalCount = false,
    showOnlyBookmarks = false,
    mapResultsFunc = mapResultsToPouchDocs,
}) {
    query = query.trim() // Don't count whitespace searches

    // Create SI query
    const indexQuery = new QueryBuilder()
        .searchTerm(query)
        .filterTime({ startDate, endDate }, 'bookmark/')
        .filterTime({ startDate, endDate }, 'visit/')
        .filterTags(tags)
        .filterDomains(domains)
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
    })

    // console.log('got results', results)

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
    const docs = await mapResultsFunc(results, {
        startDate,
        endDate,
        showOnlyBookmarks,
    })

    console.log('DEBUG: final UI results', docs)

    NewSearchTriggered()

    return {
        docs,
        resultsExhausted: docs.length < limit,
        totalCount,
        isBadTerm: false,
    }
}

// Export index interface
export {
    addPageConcurrent,
    addPageTermsConcurrent,
    addBookmarkConcurrent,
    put,
    addTimestampConcurrent,
    updateTimestampMetaConcurrent,
} from './search-index/add'
export { initSingleLookup, keyGen, grabExistingKeys } from './search-index/util'
export { delPages, delPagesConcurrent, del } from './search-index/del'
export { indexSearch as search }
