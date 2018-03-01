import db from '..'

/**
 * Used as a helper to shape the search results for the current UI's expected result shape.
 *
 * @param {any[]} results Results array returned from `_search` method.
 * @return {any[]} Array corresponding to input `results` with all needed display data attached.
 */
export async function mapResultsToDisplay(results) {
    const resultUrls = results.map(([url]) => url)
    // Grab all the Pages needed for results
    const pages = await db.pages
        .where('url')
        .anyOf(resultUrls)
        .toArray()

    // Grab assoc. tags for all pages + create a Map of URLs => tags name array for easy lookup
    const tags = await db.tags
        .where('url')
        .anyOf(resultUrls)
        .toArray()

    const pageTagsMap = new Map()
    for (const { name, url } of tags) {
        const tags = pageTagsMap.get(url) || []
        pageTagsMap.set(url, [...tags, name])
    }

    const displayPages = new Map()
    for (const page of pages) {
        await page.loadRels()

        // Only keep around the data needed for display
        displayPages.set(page.url, {
            url: page.fullUrl,
            title: page.fullTitle,
            hasBookmark: page.hasBookmark,
            displayTime: page.latest,
            tags: pageTagsMap.get(page.url) || [],
            screenshot: page.screenshotURI,
            favIcon: page.favIconURI,
        })
    }

    // Return display page data in order of input results
    return results.map(([url]) => displayPages.get(url))
}
