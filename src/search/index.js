import QueryBuilder from './query-builder'
import mapResultsToPouchDocs from './map-search-to-pouch'
import * as oldBackend from './search-index-old'
import * as newBackend from './search-index-new'

const getBackend = (() => {
    let backend = null
    return async function() {
        if (!backend) {
            backend = (await oldBackend.hasData()) ? oldBackend : newBackend
        }
        return backend
    }
})()

//
// Adding stuff
//

export async function addPage(...args) {
    return await (await getBackend()).addPage(...args)
}

export async function addPageTerms(...args) {
    return await (await getBackend()).addPageTerms(...args)
}

export async function updateTimestampMeta(...args) {
    return await (await getBackend()).updateTimestampMeta(...args)
}

//
// Deleting stuff
//
export async function delPages(...args) {
    return await (await getBackend()).delPages(...args)
}

//
// Tags
//
export async function setTags(...args) {
    return await (await getBackend()).setTags(...args)
}

export async function addTags(...args) {
    return await (await getBackend()).addTags(...args)
}

export async function delTags(...args) {
    return await (await getBackend()).delTags(...args)
}

export async function fetchTags(...args) {
    return await (await getBackend()).fetchTags(...args)
}

//
// Bookmarks
//
export async function addBookmark(...args) {
    return await (await getBackend()).addBookmark(...args)
}

export async function createBookmarkByUrl(...args) {
    return await (await getBackend()).createBookmarkByUrl(...args)
}

export async function createNewPageForBookmark(...args) {
    return await (await getBackend()).createNewPageForBookmark(...args)
}

export async function removeBookmarkByUrl(...args) {
    return await (await getBackend()).removeBookmarkByUrl(...args)
}

//
// Utilities
//
export function initSingleLookup() {
    let singleLookup
    return async function(...args) {
        if (!singleLookup) {
            singleLookup = (await getBackend()).initSingleLookup()
        }
        return await singleLookup(...args)
    }
}

export async function grabExistingKeys(...args) {
    return await (await getBackend()).grabExistingKeys(...args)
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
    const {
        results,
        totalCount,
    } = await (await getBackend()).search(indexQuery, {
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

export async function suggest(...args) {
    return await (await getBackend()).suggest(...args)
}

export const indexQueue = {
    clear: async () => {
        ;(await getBackend()).indexQueue.clear()
    },
}

// Export index interface
export { keyGen, removeKeyType } from './util'
