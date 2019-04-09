import { Dexie, SearchParams, FilteredURLs } from '..'
import intersection from 'lodash/fp/intersection'
import flatten from 'lodash/fp/flatten'
import difference from 'lodash/fp/difference'

const pageIndexLookup = (getDb: () => Promise<Dexie>) => async (
    index: string,
    matches: string[],
) => {
    const db = await getDb()
    return db.pages
        .where(index)
        .anyOf(matches)
        .primaryKeys()
}

/**
 * Affords hiding away of the URL filters (tags, domains inc/exc) and related
 * messy logic behind a more-simple interface to check whether URLs are filtered out or not.
 */
export class FilteredURLsManager implements FilteredURLs {
    include: Set<string>
    exclude: Set<string>
    isDataFiltered: boolean

    constructor({
        incDomainUrls,
        excDomainUrls,
        incTagUrls,
        excTagUrls,
        listUrls,
    }: {
        [key: string]: Set<string>
    }) {
        // Exclude any undefined URLs filters
        const allUrls = [
            incDomainUrls ? [...incDomainUrls] : incDomainUrls,
            incTagUrls ? [...incTagUrls] : incTagUrls,
            listUrls ? [...listUrls] : listUrls,
        ].filter(urls => urls != null)

        // Depends on no. of applied filters whether to take intersection or just flatten.
        const initInclude =
            allUrls.length > 1 ? intersection(...allUrls) : flatten(allUrls)

        // Ensure no excluded URLs in included sets
        this.include = new Set(
            difference(initInclude, [
                ...(excDomainUrls || []),
                ...(excTagUrls || []),
            ]),
        )

        this.exclude = new Set([
            ...(excDomainUrls || []),
            ...(excTagUrls || []),
        ])

        this.isDataFiltered = !!(incDomainUrls || incTagUrls || listUrls)
    }

    private isIncluded(url: string) {
        return this.isDataFiltered ? this.include.has(url) : true
    }

    private isExcluded(url: string) {
        return this.exclude.size ? this.exclude.has(url) : false
    }

    isAllowed(url: string) {
        return this.isIncluded(url) && !this.isExcluded(url)
    }
}

const tagSearch = (getDb: () => Promise<Dexie>) => async (tags: string[]) => {
    const db = await getDb()
    if (!tags || !tags.length) {
        return undefined
    }

    const urls = new Set<string>()

    await db.tags
        .where('name')
        .anyOf(tags)
        .eachPrimaryKey(([name, url]) => urls.add(url))

    return urls
}

const incTagSearch = (getDb: () => Promise<Dexie>) => ({
    tags,
}: Partial<SearchParams>) => tagSearch(getDb)(tags)
const excTagSearch = (getDb: () => Promise<Dexie>) => ({
    tagsExc,
}: Partial<SearchParams>) => tagSearch(getDb)(tagsExc)

/**
 * Grabs all URLs associated with given domains; either matching in `domain` or `hostname` fields.
 */
const domainSearch = (getDb: () => Promise<Dexie>) => async (
    domains: string[],
) => {
    if (!domains || !domains.length) {
        return undefined
    }

    const [domainUrls, hostnameUrls] = await Promise.all([
        pageIndexLookup(getDb)('hostname', domains),
        pageIndexLookup(getDb)('domain', domains),
    ])

    return new Set([...domainUrls, ...hostnameUrls])
}

const incDomainSearch = (getDb: () => Promise<Dexie>) => ({
    domains,
}: Partial<SearchParams>) => domainSearch(getDb)(domains)
const excDomainSearch = (getDb: () => Promise<Dexie>) => ({
    domainsExclude,
}: Partial<SearchParams>) => domainSearch(getDb)(domainsExclude)

const listSearch = (getDb: () => Promise<Dexie>) => async ({
    lists,
}: Partial<SearchParams>) => {
    if (!lists || !lists.length || !lists[0].length) {
        return undefined
    }

    const db = await getDb()
    const urls = new Set<string>()

    // The list filter contains only one list at a time
    // It is just a temporary hack until multiple lists for filtering in used.
    // Eg: The list: String i.e = "23" gets converted into ["2", "3"] converting back to 23.
    const listEntries = await db
        .table('pageListEntries')
        .where('listId')
        .equals(Number(lists[0]))
        .toArray()

    listEntries.forEach(({ pageUrl }: any) => urls.add(pageUrl))

    return urls
}

/**
 * of URLs that match the filters to use as a white-list.
 */
export const findFilteredUrls = (getDb: () => Promise<Dexie>) => async (
    params: Partial<SearchParams>,
): Promise<FilteredURLs> => {
    const [
        incDomainUrls,
        excDomainUrls,
        incTagUrls,
        excTagUrls,
        listUrls,
    ] = await Promise.all([
        incDomainSearch(getDb)(params),
        excDomainSearch(getDb)(params),
        incTagSearch(getDb)(params),
        excTagSearch(getDb)(params),
        listSearch(getDb)(params),
    ])

    return new FilteredURLsManager({
        incTagUrls,
        excTagUrls,
        incDomainUrls,
        excDomainUrls,
        listUrls,
    })
}
