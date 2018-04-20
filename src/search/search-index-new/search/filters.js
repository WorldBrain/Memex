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
 * Time: O(#domains * 2 log n)
 *
 * @param {SearchParams} params
 * @return {Promise<Set<string> | null>}
 */
async function domainSearch({ domains }) {
    if (!domains || !domains.length) {
        return null
    }

    const hostnameUrls = await db.pages
        .where('hostname')
        .anyOf(domains)
        .primaryKeys()

    const domainUrls = await db.pages
        .where('domain')
        .anyOf(domains)
        .primaryKeys()

    return new Set([...domainUrls, ...hostnameUrls])
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
