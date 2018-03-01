import db from '..'
import { getLatestVisitsByUrl } from './visits'
import { mapResultsToDisplay } from './map-results-to-display'

/**
 * @typedef {Object} SearchParams
 * @property {string[]} [tags=[]]
 * @property {string[]} [domains=[]]
 * @property {string[]} [queryTerms=[]]
 */

/**
 * @typedef {Array} SearchResult
 * @property {string} 0 URL of found page.
 * @property {number} 1 Timestamp of latest event.
 */

/**
 * @param {SearchParams} params
 * @return {Promise<SearchDisplayResult[]>}
 */
export default async function search(params) {
    console.log('QUERY:', params)

    console.time('search')
    let results = !params.queryTerms.length
        ? await blankSearch(params)
        : await standardSearch(params)
    console.timeEnd('search')

    console.log(results)
    console.time('search result mapping')
    results = await mapResultsToDisplay(results)
    console.timeEnd('search result mapping')

    return results
}

/**
 * @param {SearchParams} params
 * @return {Promise<Set<string> | null>}
 */
async function tagSearch({ tags = [] }) {
    if (!tags || !tags.length) {
        return null
    }

    const urls = new Set()

    await db.tags
        .where('name')
        .anyOf(tags)
        .eachPrimaryKey(([name, url]) => urls.add(url))

    return urls
}

/**
 * @param {SearchParams} params
 * @return {Promise<Set<string> | null>}
 */
async function domainSearch({ domains }) {
    if (!domains || !domains.length) {
        return null
    }

    const urls = await db.pages
        .where('domain')
        .anyOf(domains)
        .primaryKeys()

    return new Set(urls)
}

/**
 * @param {SearchParams} params
 * @return {Promise<Set<string> | null>}
 */
async function deriveFilteredURLs(params) {
    const [domainsUrls, tagsUrls] = await Promise.all([
        domainSearch(params),
        tagSearch(params),
    ])

    // Perform intersection, only if both non-null
    if (domainsUrls != null && tagsUrls != null) {
        return new Set([...domainsUrls].filter(url => tagsUrls.has(url)))
    }

    // Or just return the non-null one, or null
    return domainsUrls == null ? tagsUrls : domainsUrls
}

/**
 * @param {SearchResult[]} resultEntries Map entries (2-el KVP arrays) of URL keys to latest times
 * @param {number} [args.skip=0]
 * @param {number} [args.limit=10]
 * @return {SearchResult[]} Sorted and trimmed version of `resultEntries` input.
 */
const paginate = (resultEntries, { skip = 0, limit = 10 }) =>
    resultEntries.sort(([, a], [, b]) => b - a).slice(skip, skip + limit)

/**
 * Runs for blank terms searches.
 * @
 */
async function blankSearch(params) {
    const urlScopeSet = await deriveFilteredURLs(params)
    console.log(urlScopeSet)

    const latestVisitsByUrl = await getLatestVisitsByUrl(
        params,
        urlScopeSet,
        true,
    )
    console.log('latest:', latestVisitsByUrl)

    return paginate([...latestVisitsByUrl], params)
}

/**
 * @param {SearchParams} params
 * @return {Promise<SearchResult[]>} Ordered array of result KVPs of latest visit timestamps to page URLs.
 */
async function standardSearch({
    queryTerms = [],
    bookmarks = false,
    ...params
}) {
    const filteredURLs = await deriveFilteredURLs(params)
    console.log('scope:', filteredURLs)

    // Fetch all latest visits in time range, grouped by URL
    const latestVisitsByUrl = await getLatestVisitsByUrl(params, filteredURLs)
    console.log('latest:', latestVisitsByUrl)

    // Fetch all pages with terms matching query (TODO: make it AND the queryTerms set)
    let matchingPageUrls = await db.pages
        .where('titleTerms')
        .anyOf(queryTerms)
        .distinct()
        .or('urlTerms')
        .anyOf(queryTerms)
        .distinct()
        .or('terms')
        .anyOf(queryTerms)
        .distinct()
        // Filter matching pages down by domains, if specified + visit results
        .filter(page => latestVisitsByUrl.has(page.url))
        .primaryKeys()

    // Further filter down by bookmarks, if specified
    if (bookmarks) {
        matchingPageUrls = await db.bookmarks
            .where('url')
            .anyOf(matchingPageUrls)
            .primaryKeys()
    }

    // Paginate
    return paginate(
        matchingPageUrls.map(url => [url, latestVisitsByUrl.get(url)]),
        params,
    )
}
