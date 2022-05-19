import intersection from 'lodash/fp/intersection'
import flatten from 'lodash/fp/flatten'
import difference from 'lodash/fp/difference'

import { DBGet, SearchParams, FilteredIDs } from '..'
import { DexieUtilsPlugin } from '../plugins/dexie-utils'
import { PageListEntry } from 'src/custom-lists/background/types'

const pageIndexLookup = (getDb: DBGet) => async (
    index: string,
    matches: string[],
): Promise<string> => {
    const db = await getDb()
    return db.operation(DexieUtilsPlugin.GET_PKS_OP, {
        collection: 'pages',
        fieldName: index,
        opName: 'anyOf',
        opValue: matches,
    })
}

/**
 * Affords hiding away of the search filters (tags, domains inc/exc) and related
 * messy logic behind a more-simple interface to check whether IDs are filtered out or not.
 */
export class FilteredIDsManager<T> implements FilteredIDs<T> {
    include: Set<T>
    exclude: Set<T>
    isDataFiltered: boolean

    constructor({
        incDomainUrls,
        excDomainUrls,
        incTagUrls,
        excTagUrls,
        listUrls,
        incUserUrls,
        excUserUrls,
        incHashtagUrls,
        excHashtagUrls,
    }: {
        [key: string]: Set<T>
    }) {
        // Exclude any undefined URLs filters
        const allUrls = [
            incDomainUrls ? [...incDomainUrls] : incDomainUrls,
            incTagUrls ? [...incTagUrls] : incTagUrls,
            listUrls ? [...listUrls] : listUrls,
            incUserUrls ? [...incUserUrls] : incUserUrls,
            incHashtagUrls ? [...incHashtagUrls] : incHashtagUrls,
        ].filter((urls) => urls != null)

        // Depends on no. of applied filters whether to take intersection or just flatten.
        const initInclude =
            allUrls.length > 1
                ? (intersection as any)(...allUrls)
                : (flatten as any)(allUrls)

        // Ensure no excluded URLs in included sets
        this.include = new Set(
            (difference as any)(initInclude, [
                ...(excUserUrls || []),
                ...(excDomainUrls || []),
                ...(excTagUrls || []),
                ...(excHashtagUrls || []),
            ]),
        )

        this.exclude = new Set([
            ...(excUserUrls || []),
            ...(excDomainUrls || []),
            ...(excTagUrls || []),
            ...(excHashtagUrls || []),
        ])

        this.isDataFiltered = !!(
            incDomainUrls ||
            incTagUrls ||
            listUrls ||
            incUserUrls ||
            incHashtagUrls
        )
    }

    private isIncluded(url: T): boolean {
        return this.isDataFiltered ? this.include.has(url) : true
    }

    private isExcluded(url: T): boolean {
        return this.exclude.size ? this.exclude.has(url) : false
    }

    isAllowed(url: T): boolean {
        return this.isIncluded(url) && !this.isExcluded(url)
    }
}

const tagSearch = (getDb: DBGet) => async (tags: string[]) => {
    const db = await getDb()
    if (!tags || !tags.length) {
        return undefined
    }

    const urls = new Set<string>()

    const tagDocs = await db
        .collection('tags')
        .findObjects({ name: { $in: tags } })

    tagDocs.forEach(({ url }) => urls.add(url))

    return urls
}

const incTagSearch = (getDb: DBGet) => ({ tags }: Partial<SearchParams>) =>
    tagSearch(getDb)(tags)
const excTagSearch = (getDb: DBGet) => ({ tagsExc }: Partial<SearchParams>) =>
    tagSearch(getDb)(tagsExc)

/**
 * Grabs all URLs associated with given domains; either matching in `domain` or `hostname` fields.
 */
const domainSearch = (getDb: DBGet) => async (domains: string[]) => {
    if (!domains || !domains.length) {
        return undefined
    }

    const [domainUrls, hostnameUrls] = await Promise.all([
        pageIndexLookup(getDb)('hostname', domains),
        pageIndexLookup(getDb)('domain', domains),
    ])

    return new Set([...domainUrls, ...hostnameUrls])
}

const incDomainSearch = (getDb: DBGet) => ({
    domains,
}: Partial<SearchParams>) => domainSearch(getDb)(domains)
const excDomainSearch = (getDb: DBGet) => ({
    domainsExclude,
}: Partial<SearchParams>) => domainSearch(getDb)(domainsExclude)

const listSearch = (getDb: DBGet) => async ({
    lists,
}: Partial<SearchParams>) => {
    if (!lists || !lists.length) {
        return undefined
    }

    const db = await getDb()
    const urls = new Set<string>()

    const listEntries: PageListEntry[] = await db
        .collection('pageListEntries')
        .findObjects({ listId: { $in: lists } })

    const listsByUrl = new Map<string, number[]>()
    listEntries.forEach(({ pageUrl, listId }) =>
        listsByUrl.set(pageUrl, [...(listsByUrl.get(pageUrl) ?? []), listId]),
    )

    for (const [url, memberLists] of listsByUrl.entries()) {
        if (
            lists.length === memberLists.length &&
            memberLists.every((listId) => lists.includes(listId))
        ) {
            urls.add(url)
        }
    }
    return urls
}

/**
 * of URLs that match the filters to use as a white-list.
 */
export const findFilteredUrls = (getDb: DBGet) => async (
    params: Partial<SearchParams>,
): Promise<FilteredIDs> => {
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

    return new FilteredIDsManager({
        incTagUrls,
        excTagUrls,
        incDomainUrls,
        excDomainUrls,
        listUrls,
    })
}
