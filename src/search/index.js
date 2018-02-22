import QueryBuilder from './query-builder'
import mapResultsToPouchDocs from './map-search-to-pouch'
import * as oldIndex from './search-index'

//
// Adding stuff
//

export async function addPage(...args) {
    return await oldIndex.addPage(...args)
}

export async function addPageTerms(...args) {
    return await oldIndex.addPageTerms(...args)
}

export async function updateTimestampMeta(...args) {
    return await oldIndex.updateTimestampMeta(...args)
}

//
// Deleting stuff
//
export async function delPages(...args) {
    return await oldIndex.delPages(...args)
}

//
// Tags
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
// Bookmarks
//
export async function addBookmark(...args) {
    return await oldIndex.addBookmark(...args)
}

export async function createBookmarkByUrl(...args) {
    return await oldIndex.createBookmarkByUrl(...args)
}

export async function createNewPageForBookmark(...args) {
    return await oldIndex.createNewPageForBookmark(...args)
}

export async function removeBookmarkByUrl(...args) {
    return await oldIndex.removeBookmarkByUrl(...args)
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
// Searching & suggesting
//

export async function search({
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
    const { results, totalCount } = await oldIndex.search(indexQuery, {
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

export function suggest(...args) {
    return oldIndex.suggest(...args)
}

// Export index interface
export { default as index, indexQueue } from './search-index'
