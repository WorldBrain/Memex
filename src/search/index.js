import { STORAGE_KEYS as ANALYTIC_STORAGE_KEYS } from 'src/analytics/constants'
import QueryBuilder from './query-builder'
import { searchConcurrent } from './search-index/search'
import mapResultsToPouchDocs from './map-search-to-pouch'

async function indexSearch({
    query,
    startDate,
    endDate,
    tags = [],
    skip = 0,
    limit = 10,
    getTotalCount = false,
    showOnlyBookmarks = false,
}) {
    query = query.trim() // Don't count whitespace searches

    // Create SI query
    const indexQuery = new QueryBuilder()
        .searchTerm(query)
        .filterTime({ startDate, endDate }, 'bookmark/')
        .filterTime({ startDate, endDate }, 'visit/')
        .filterTags(tags)
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

    // Update the last search time in storage (used only for analytics purposes)
    browser.storage.local.set({ [ANALYTIC_STORAGE_KEYS.SEARCH]: Date.now() })
    console.log('DEBUG: query', indexQuery)

    // Get index results, filtering out any unexpectedly structured results
    const { results, totalCount } = await searchConcurrent(indexQuery, {
        count: getTotalCount,
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
    const docs = await mapResultsToPouchDocs(results, {
        startDate,
        endDate,
        showOnlyBookmarks,
    })

    console.log('DEBUG: final UI results', docs)

    return {
        docs,
        resultsExhausted: docs.length < limit,
        totalCount,
        isBadTerm: false,
    }
}

// Export index interface
export {
    addPage,
    addPageConcurrent,
    addBookmarkConcurrent,
    put,
    addMetaConcurrent,
} from './search-index/add'
export { initSingleLookup, keyGen, grabExistingKeys } from './search-index/util'
export { delPages, delPagesConcurrent, del } from './search-index/del'
export { indexSearch as search }
