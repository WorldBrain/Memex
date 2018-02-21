import QueryBuilder from './query-builder'
import { searchConcurrent } from './search-index/search'
import mapResultsToPouchDocs from './map-search-to-pouch'
import * as oldIndex from './search-index'

//
// Adding stuff
//

export async function addPageConcurrent(...args) {
    return await oldIndex.addPageConcurrent(...args)
}

export async function addPageTermsConcurrent(...args) {
    return await oldIndex.addPageTermsConcurrent(...args)
}

export async function addBookmarkConcurrent(...args) {
    return await oldIndex.addBookmarkConcurrent(...args)
}

export async function put(...args) {
    return await oldIndex.put(...args)
}

export async function updateTimestampMetaConcurrent(...args) {
    return await oldIndex.updateTimestampMetaConcurrent(...args)
}

//
// Deleting stuff
//
export async function delPages(...args) {
    return await oldIndex.delPages(...args)
}

export async function delPagesConcurrent(...args) {
    return await oldIndex.delPagesConcurrent(...args)
}

export async function del(...args) {
    return await oldIndex.del(...args)
}

//
// Tagging
//
export async function setTags(...args) {
    return await oldIndex.setTags(...args)
}

export async function addTags(...args) {
    return await oldIndex.addTags(...args)
}

export async function delTags(...args) {
    return await oldIndex.delTags(...args)
}

export async function fetchTags(...args) {
    return await oldIndex.fetchTags(...args)
}

//
// Utilities
//
export function initSingleLookup(...args) {
    return oldIndex.initSingleLookup(...args)
}

export const keyGen = oldIndex.keyGen // Is an object with functions

export function grabExistingKeys(...args) {
    return oldIndex.grabExistingKeys(...args)
}

export function removeKeyType(...args) {
    return oldIndex.removeKeyType(...args)
}

//
// Searching
//

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

    return {
        docs,
        resultsExhausted: docs.length < limit,
        totalCount,
        isBadTerm: false,
    }
}

// Export index interface
export { default as index, indexQueue } from './search-index'
export { indexSearch as search }
