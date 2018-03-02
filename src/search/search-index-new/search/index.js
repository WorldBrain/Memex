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
 * Should be run from inside a Dexie transaction.
 *
 * @param {SearchParams} params
 */
export default async function search(params) {
    console.log('QUERY:', params)

    console.time('search')
    const results = await matchingPagesSearch(params)
    console.timeEnd('search')

    console.log(results)
    console.time('search result mapping')
    const docs = await mapResultsToDisplay(results.ids)
    console.timeEnd('search result mapping')

    return { docs, totalCount: results.totalCount }
}

/**
 * @param {SearchParams} params
 * @return {Promise<Set<string> | null>}
 */
async function tagSearch({ tags }) {
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

const termQuery = (term, index) =>
    db.pages
        .where(index)
        .equals(term)
        .primaryKeys()

/**
 * @param {SearchParams} params
 * @param {Set<string>} filteredURLs
 * @return {Promise<Map<string, number>>}
 */
async function termSearch({ queryTerms }, filteredURLs) {
    if (!queryTerms || !queryTerms.length) {
        // If blank search, all will have score multipliers of 1
        return new Map([...filteredURLs].map(url => [url, 1]))
    }

    const results = await Promise.all(
        queryTerms.map(async term => ({
            content: await termQuery(term, 'terms'),
            title: await termQuery(term, 'titleTerms'),
            url: await termQuery(term, 'urlTerms'),
        })),
    )

    // Creates a Map of URLs to score multipliers, based on if they were found in title, URL, or content terms,
    //  These are intersected between results for separate words
    return results
        .map(({ content, title, url }) => {
            const urlScoreMap = new Map()
            const add = multiplier => url => {
                const existing = urlScoreMap.get(url)
                if (
                    filteredURLs.has(url) &&
                    (!existing || existing < multiplier)
                ) {
                    urlScoreMap.set(url, multiplier)
                }
            }

            content.forEach(add(1))
            url.forEach(add(1.1))
            title.forEach(add(1.2))
            return urlScoreMap
        })
        .reduce((a, b) => new Map([...a].filter(([url]) => b.has(url))))
}

/**
 * @param {SearchParams} params
 */
async function matchingPagesSearch({
    queryTerms = [],
    bookmarks = false,
    ...params
}) {
    const filteredUrls = await deriveFilteredURLs(params)

    // Fetch all latest visits in time range, grouped by URL
    const filteredUrlTimes = await getLatestVisitsByUrl(
        params,
        filteredUrls,
        !queryTerms.length,
    )

    let urlScoreMap = await termSearch(
        { queryTerms },
        new Set(filteredUrlTimes.keys()),
    )

    // Further filter down by bookmarks, if specified
    if (bookmarks) {
        const matchingBookmarks = new Set(
            await db.bookmarks
                .where('url')
                .anyOf(urlScoreMap.keys())
                .primaryKeys(),
        )

        urlScoreMap = new Map(
            [...urlScoreMap].filter(([url]) => matchingBookmarks.has(url)),
        )
    }

    // Apply scoring by relating the score maps (URL -> multipliers) back to latest time maps (URL -> timestamp)
    const scoredResults = [...urlScoreMap].map(([url, multiplier]) => [
        url,
        filteredUrlTimes.get(url) * multiplier,
    ])

    // Paginate
    return {
        ids: paginate(scoredResults, params),
        totalCount: urlScoreMap.size,
    }
}
