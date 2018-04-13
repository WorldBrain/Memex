import db from '..'
import { Page, FavIcon } from '../models'

export interface SearchDisplayResult {
    url: string
    title: string
    hasBookmark: boolean
    displayTime: number
    screenshot: string
    favIcon: string
    tags: string[]
}

// TODO: move somewhere
export interface SearchParams {
    domains: string[]
    tags: string[]
    queryTerms: string[]
    endDate?: number
    startDate?: number
    skip: number
    limit: number
}

export type SearchResult = [string, number]

const mapPageToDisplay = (
    pagesMap: Map<string, Page>,
    favIconsMap: Map<string, FavIcon>,
    { endDate }: SearchParams,
) =>
    async function([url]: SearchResult): Promise<SearchDisplayResult> {
        const page = pagesMap.get(url)
        const favIcon = favIconsMap.get(page.domain)
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
    const domainsSet = new Set<string>()
    const favIconsMap = new Map<string, FavIcon>()

    // Grab all pages + tags for pages, creating a Map for easy lookup-by-URL + set of domains
    await db.pages
        .where('url')
        .anyOf(resultUrls)
        .each(page => {
            domainsSet.add(page.domain)
            pagesMap.set(page.url, page)
        })

    // Grab all corresponding fav-icons for domains set
    await db.favIcons
        .where('domain')
        .anyOf(...domainsSet)
        .each(favIcon => favIconsMap.set(favIcon.domain, favIcon))

    // Grab all the Pages needed for results (mapping over input `results` to maintain order)
    return await Promise.all(
        results.map(mapPageToDisplay(pagesMap, favIconsMap, params)),
    )
}
