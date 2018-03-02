import db from '..'

/**
 * @typedef {Object} SearchDisplayResult
 * @property {string} url
 * @property {string} title
 * @property {boolean} hasBookmark
 * @property {number} displayTime
 * @property {string[]} tags
 * @property {string} [screenshot]
 * @property {string} [favIcon]
 */

/**
 * @param {string[]>} resultUrls URLs to get tags for.
 * @return {Map<string, string[]>} Map of URL keys (from `resultUrls`) to array of assoc. tag names.
 */
async function findAssocTags(resultUrls) {
    // Grab assoc. tags for all pages + create a Map of URLs => tags name array for easy lookup
    const tags = await db.tags
        .where('url')
        .anyOf(resultUrls)
        .primaryKeys()

    const pageTagsMap = new Map()
    for (const [name, url] of tags) {
        const tags = pageTagsMap.get(url) || []
        pageTagsMap.set(url, [...tags, name])
    }

    return pageTagsMap
}

const mapPageToDisplay = (pageTagsMap, { endDate }) =>
    async function(page) {
        await page.loadRels()

        return {
            url: page.fullUrl,
            title: page.fullTitle,
            hasBookmark: page.hasBookmark,
            displayTime: page.getLatest(endDate),
            tags: pageTagsMap.get(page.url) || [],
            screenshot: page.screenshotURI,
            favIcon: page.favIconURI,
        }
    }

/**
 * Used as a helper to shape the search results for the current UI's expected result shape.
 *
 * @param {SearchResult[]} results
 * @param {SearchParams} params
 * @return {Promise<SearchDisplayResult[]>} Array corresponding to input `results` with
 *  all needed display data attached.
 */
export async function mapResultsToDisplay(results, params) {
    const resultUrls = results.map(([url]) => url)

    // Grab all pages + tags for pages
    const [pageTagsMap, pages] = await Promise.all([
        findAssocTags(resultUrls),
        db.pages
            .where('url')
            .anyOf(resultUrls)
            .toArray(),
    ])

    // Grab all the Pages needed for results
    return await Promise.all(pages.map(mapPageToDisplay(pageTagsMap, params)))
}
