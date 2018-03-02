import db from '..'

/**
 * Space: O(#matchingURLs}
 * Time: O(#tags * log n)
 *
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
 * Space: O(#matchingURLs}
 * Time: O(#domains * log n)
 *
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
 * If filters are defined, attempts to resolve a Set of URL keys
 * of URLs that match the filters to use as a white-list.
 * Space: O(#matchingURLs}
 * Time: O(#largestfilter * log n)
 *
 * @param {SearchParams} params
 * @return {Promise<Set<string> | null>} Resolves to `null` if no filters defined.
 */
export async function findFilteredUrls(params) {
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
 * Time: O(#urlScoreMap * log n)
 * Space: O(#matchedBms OR #urlScoreMap)
 *
 * @param {SearchParams} params
 * @param {Map<string, number>} matchedUrlsMap The results so far to filter down.
 * @return {Promise<Map<string, number>>} Filtered version of `urlScoreMap`, if `params.bookmarks` was set.
 */
export async function filterByBookmarks({ bookmarks }, matchedUrlsMap) {
    if (!bookmarks) {
        return matchedUrlsMap
    }

    const matchingBookmarks = new Set(
        await db.bookmarks
            .where('url')
            .anyOf(matchedUrlsMap.keys())
            .primaryKeys(),
    )

    return new Map(
        [...matchedUrlsMap].filter(([url]) => matchingBookmarks.has(url)),
    )
}
