import db from '..'
import { getLatestVisitsByUrl } from './visits'
import { mapResultsToDisplay } from './map-results-to-display'

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

async function tagSearch({ tags = [] }) {
    const urls = new Set()

    await db.tags
        .where('name')
        .anyOf(tags)
        .eachPrimaryKey(([name, url]) => urls.add(url))

    return urls
}

/**
 * @param {any[]} resultEntries Map entries (2-el KVP arrays) of URL keys to latest times
 * @param {number} [args.skip=0]
 * @param {number} [args.limit=10]
 * @return {any[]} Sorted and trimmed version of `resultEntries` input.
 */
const paginate = (resultEntries, { skip = 0, limit = 10 }) =>
    resultEntries.sort(([, a], [, b]) => b - a).slice(skip, skip + limit)

/**
     * Runs for blank terms searches.
     */
async function blankSearch({
    domains = [], // TODO: support these
    bookmarks = false,
    ...params
}) {
    const urlScopeSet = await tagSearch(params)
    const latestVisitsByUrl = await getLatestVisitsByUrl(
        params,
        urlScopeSet,
        true,
    )

    return paginate([...latestVisitsByUrl], params)
}

/**
     * @param {string} [args.query=''] Terms search query.
     * @param {boolean} [args.bookmarks=false] Whether or not to filter by bookmarked pages only.
     * @return {Promise<[number, string][]>} Ordered array of result KVPs of latest visit timestamps to page URLs.
     */
async function standardSearch({
    queryTerms = [],
    domains = [],
    bookmarks = false,
    ...params
}) {
    const domainsSet = new Set(domains)
    const urlScopeSet = await tagSearch(params)

    // Fetch all latest visits in time range, grouped by URL
    const latestVisitsByUrl = await getLatestVisitsByUrl(params, urlScopeSet)

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
        .filter(page => {
            if (domainsSet.size > 0 && !domainsSet.has(page.domain)) {
                return false
            }

            return latestVisitsByUrl.has(page.url)
        })
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
