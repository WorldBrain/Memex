import getDb, { SearchParams, FilteredURLs, storageManager } from '..'
import { remoteFunction } from '../../util/webextensionRPC'
import CustomListBackground from '../../custom-lists/background'
import intersection from 'lodash/fp/intersection'
import flatten from 'lodash/fp/flatten'
import difference from 'lodash/fp/difference'

const pageIndexLookup = async (index: string, matches: string[]) => {
    const db = await getDb
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
        tagUrls,
        listUrls,
    }: {
        [key: string]: Set<string>
    }) {
        // Exclude any undefined URLs filters
        const allUrls = [
            incDomainUrls ? [...incDomainUrls] : incDomainUrls,
            tagUrls ? [...tagUrls] : tagUrls,
            listUrls ? [...listUrls] : listUrls,
        ].filter(urls => urls != null)

        // Depends on no. of applied filters whether to take intersection or just flatten.
        const initInclude =
            allUrls.length > 1 ? intersection(...allUrls) : flatten(allUrls)

        // Ensure no excluded URLs in included sets
        this.include = new Set(
            difference(initInclude, [...(excDomainUrls || [])]),
        )

        this.exclude = excDomainUrls || new Set()
        this.isDataFiltered = !!(incDomainUrls || tagUrls || listUrls)
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

async function tagSearch({ tags }: Partial<SearchParams>) {
    const db = await getDb
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

/**
 * Grabs all URLs associated with given domains; either matching in `domain` or `hostname` fields.
 */
async function domainSearch(domains: string[]) {
    if (!domains.length) {
        return undefined
    }

    const [domainUrls, hostnameUrls] = await Promise.all([
        pageIndexLookup('hostname', domains),
        pageIndexLookup('domain', domains),
    ])

    return new Set([...domainUrls, ...hostnameUrls])
}

const incDomainSearch = ({ domains }: Partial<SearchParams>) =>
    domainSearch(domains)
const excDomainSearch = ({ domainsExclude }: Partial<SearchParams>) =>
    domainSearch(domainsExclude)

async function listSearch({ lists }: Partial<SearchParams>) {
    if (!lists || !lists.length || !lists[0].length) {
        return undefined
    }

    const customList = new CustomListBackground({ storageManager })

    const urls = new Set<string>()

    // The list filter contains only one list at a time
    // It is just a temporary hack until multiple lists for filtering in used.
    // Eg: The list: String i.e = "23" gets converted into ["2", "3"] converting back to 23.
    const listEnteries = await customList.fetchListPagesById({
        id: Number(lists[0]),
    })
    listEnteries.forEach(({ pageUrl }: any) => urls.add(pageUrl))

    return urls
}

/**
 * of URLs that match the filters to use as a white-list.
 */
export async function findFilteredUrls(
    params: Partial<SearchParams>,
): Promise<FilteredURLs> {
    const [incDomainUrls, excDomainUrls, tagUrls, listUrls] = await Promise.all(
        [
            incDomainSearch(params),
            excDomainSearch(params),
            tagSearch(params),
            listSearch(params),
        ],
    )

    return new FilteredURLsManager({
        tagUrls,
        incDomainUrls,
        excDomainUrls,
        listUrls,
    })
}
