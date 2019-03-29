import { Page, FavIcon } from '../models'
import { SearchParams, SearchResult, DBGet } from '../types'

export interface SearchDisplayResult {
    url: string
    title: string
    hasBookmark: boolean
    displayTime: number
    screenshot: string
    favIcon: string
    tags: string[]
}

const mapPageToDisplay = (
    pagesMap: Map<string, Page>,
    favIconsMap: Map<string, FavIcon>,
    { endDate }: SearchParams,
    getDb: DBGet,
) =>
    async function([url]: SearchResult): Promise<SearchDisplayResult> {
        const db = await getDb()
        const page = new Page(db, pagesMap.get(url))
        const favIcon = favIconsMap.get(page.hostname)
        await page.loadRels()

        return {
            url: page.fullUrl,
            title: page.fullTitle,
            hasBookmark: page.hasBookmark,
            displayTime: page.getLatest(endDate),
            screenshot: page.screenshotURI,
            favIcon: favIcon != null ? favIcon.favIconURI : undefined,
            tags: page.tags,
        }
    }

/**
 * Used as a helper to shape the search results for the current UI's expected result shape.
 */
export const mapResultsToDisplay = (getDb: DBGet) => async (
    results: SearchResult[],
    params: SearchParams,
) => {
    const db = await getDb()
    const resultUrls = results.map(([url]) => url)

    const pagesMap = new Map<string, Page>()
    const hostnamesSet = new Set<string>()
    const favIconsMap = new Map<string, FavIcon>()

    // Grab all pages + tags for pages, creating a Map for easy lookup-by-URL + set of hostnames
    const pages = await db.collection('pages').findObjects<Page>({
        url: { $in: resultUrls },
    })

    pages.forEach(page => {
        hostnamesSet.add(page.hostname)
        pagesMap.set(page.url, page)
    })

    // Grab all corresponding fav-icons for hostnames set
    const favIcons = await db.collection('favIcons').findObjects<FavIcon>({
        hostname: { $in: [...hostnamesSet] },
    })
    favIcons.forEach(favIcon => favIconsMap.set(favIcon.hostname, favIcon))

    // Grab all the Pages needed for results (mapping over input `results` to maintain order)
    return Promise.all(
        results.map(mapPageToDisplay(pagesMap, favIconsMap, params, getDb)),
    )
}
