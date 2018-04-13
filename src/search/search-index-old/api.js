import { fetchPagesByUrlPattern } from 'src/pouchdb'
import index from './index'
import mapResultsToPouchDocs from './map-search-to-pouch'
import QueryBuilder from '../query-builder'
import { generatePageDocId } from 'src/page-storage'
import { addTimestampConcurrent } from './add'
import { searchConcurrent } from './search'
import { delPagesConcurrent } from './del'
import { initSingleLookup, keyGen, removeKeyType } from './util'

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
    query = '',
    startDate,
    endDate,
    tags = [],
    domains = [],
    skip = 0,
    limit = 10,
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
            totalCount: null,
            isBadTerm: true,
        }
    }

    console.log('DEBUG: query', indexQuery)

    // Get index results, filtering out any unexpectedly structured results
    const { results, totalCount } = await searchConcurrent(indexQuery)

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

export async function getPage(url) {
    const pageId = generatePageDocId({ url })
    const page = await initSingleLookup()(pageId)

    return page != null
        ? {
              latest: +page.latest,
              hasBookmark: page.bookmarks.size > 0,
              tags: page.tags ? [...page.tags].map(removeKeyType) : [],
          }
        : page
}

export const addVisit = (url, time = Date.now()) =>
    addTimestampConcurrent(generatePageDocId({ url }), `visit/${time}`)

export const delPages = urls =>
    delPagesConcurrent(urls.map(url => generatePageDocId({ url })))

export async function delPagesByDomain(url) {
    // Grab domain index entry to get set of pages
    const domainIndex = await initSingleLookup({ defaultValue: [] })(
        keyGen.domain(url),
    )

    const pageIds = [...domainIndex].map(([pageId]) => pageId)
    return await delPagesConcurrent(pageIds)
}

export async function delPagesByPattern(regex) {
    const pageRows = await fetchPagesByUrlPattern(regex)
    const pageIds = pageRows.map(({ id }) => id)
    return await delPagesConcurrent(pageIds)
}

export async function getMatchingPageCount(regex) {
    const pageRows = await fetchPagesByUrlPattern(regex)
    return pageRows.length
}

export {
    addPageConcurrent as addPage,
    addPageTermsConcurrent as addPageTerms,
    updateTimestampMetaConcurrent as updateTimestampMeta,
} from './add'
export { addTag, delTag } from './tags'
export {
    addBookmarkConcurrent as addBookmark,
    removeBookmarkByUrl as delBookmark,
    handleBookmarkCreation,
} from './bookmarks'
export { default as suggest } from './suggest'
export { grabExistingKeys } from './util'
export { indexQueue } from './'
export { initSingleLookup }

export const domainHasFavIcon = url => Promise.resolve(false)
