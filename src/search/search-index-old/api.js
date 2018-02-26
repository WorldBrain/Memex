import index from './index'
import mapResultsToPouchDocs from './map-search-to-pouch'
import QueryBuilder from '../query-builder'
import { generatePageDocId } from 'src/page-storage'
import { addTimestampConcurrent } from './add'
import { searchConcurrent } from './search'

export function hasData() {
    return new Promise((resolve, reject) => {
        let empty = true
        index.db
            .createReadStream({
                keys: true,
                values: false,
                limit: 1,
            })
            .on('data', function(data) {
                empty = false
            })
            .on('end', function() {
                resolve(!empty)
            })
    })
}

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

export const getPage = url => index.db.get(generatePageDocId({ url }))

export const addVisit = (url, time = Date.now()) =>
    addTimestampConcurrent(generatePageDocId({ url }), `visit/${time}`)

export {
    addPageConcurrent as addPage,
    addPageTermsConcurrent as addPageTerms,
    updateTimestampMetaConcurrent as updateTimestampMeta,
} from './add'
export { delPagesConcurrent as delPages } from './del'
export { setTags, addTags, delTags, fetchTags } from './tags'
export {
    addBookmarkConcurrent as addBookmark,
    createBookmarkByUrl,
    createNewPageForBookmark,
    removeBookmarkByUrl,
} from './bookmarks'
export { default as suggest } from './suggest'
export { initSingleLookup, grabExistingKeys } from './util'
export { indexQueue } from './'
