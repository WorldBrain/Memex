import db, { SearchParams, FilteredURLs } from '..'

const pageIndexLookup = (index: string, matches: string[]) =>
    db.pages
        .where(index)
        .anyOf(matches)
        .primaryKeys()

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
    }: {
        [key: string]: Set<string>
    }) {
        // Perform intersection, only if both includes sets defined, else just merge them
        const initInclude =
            incDomainUrls && tagUrls
                ? [...incDomainUrls].filter(url => tagUrls.has(url))
                : [...(incDomainUrls || []), ...(tagUrls || [])]

        // Ensure no excluded URLs in included sets
        this.include = excDomainUrls
            ? new Set([...initInclude].filter(url => !excDomainUrls.has(url)))
            : new Set(initInclude)

        this.exclude = excDomainUrls || new Set()
        this.isDataFiltered = !!(incDomainUrls || tagUrls)
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

/**
 * of URLs that match the filters to use as a white-list.
 */
export async function findFilteredUrls(
    params: Partial<SearchParams>,
): Promise<FilteredURLs> {
    const [incDomainUrls, excDomainUrls, tagUrls] = await Promise.all([
        incDomainSearch(params),
        excDomainSearch(params),
        tagSearch(params),
    ])

    return new FilteredURLsManager({ tagUrls, incDomainUrls, excDomainUrls })
}
