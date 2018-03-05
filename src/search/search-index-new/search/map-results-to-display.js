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

const mapPageToDisplay = (pagesMap, { endDate }) =>
    async function([url]) {
        const page = pagesMap.get(url)
        await page.loadRels()

        return {
            url: page.fullUrl,
            title: page.fullTitle,
            hasBookmark: page.hasBookmark,
            displayTime: page.getLatest(endDate),
            screenshot: page.screenshotURI,
            favIcon: page.favIconURI,
            tags: page.tags,
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

    // Grab all pages + tags for pages, creating a Map for easy lookup-by-URL
    const pages = await db.pages
        .where('url')
        .anyOf(resultUrls)
        .toArray()
    const pagesMap = new Map()
    pages.forEach(page => pagesMap.set(page.url, page))

    // Grab all the Pages needed for results (mapping over input `results` to maintain order)
    return await Promise.all(results.map(mapPageToDisplay(pagesMap, params)))
}
