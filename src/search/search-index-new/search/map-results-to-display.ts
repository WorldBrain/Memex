import db from '..'
import { Page, FavIcon } from '../models'
import { SearchParams, SearchResult } from '../types'

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
) =>
    async function([url]: SearchResult): Promise<SearchDisplayResult> {
        const page = pagesMap.get(url)
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
export async function mapResultsToDisplay(
    results: SearchResult[],
    params: SearchParams,
) {
    const resultUrls = results.map(([url]) => url)

    const pagesMap = new Map<string, Page>()
    const hostnamesSet = new Set<string>()
    const favIconsMap = new Map<string, FavIcon>()

    // Grab all pages + tags for pages, creating a Map for easy lookup-by-URL + set of hostnames
    await db.pages
        .where('url')
        .anyOf(resultUrls)
        .each(page => {
            hostnamesSet.add(page.hostname)
            pagesMap.set(page.url, page)
        })

    // Grab all corresponding fav-icons for hostnames set
    await db.favIcons
        .where('hostname')
        .anyOf(...hostnamesSet)
        .each(favIcon => favIconsMap.set(favIcon.hostname, favIcon))

    // Grab all the Pages needed for results (mapping over input `results` to maintain order)
    return await Promise.all(
        results.map(mapPageToDisplay(pagesMap, favIconsMap, params)),
    )
}
