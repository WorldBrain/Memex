import db, { SearchParams, FilteredURLs, storageManager } from '..'
import { remoteFunction } from '../../../util/webextensionRPC'
import CustomListBackground from '../../../custom-lists/background'
import intersection from 'lodash/fp/intersection'

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
        listUrls,
    }: {
            [key: string]: Set<string>,
        }) {

        // Perform intersection, only if both includes sets defined, else just merge them
        const allUrls = [
            incDomainUrls ? [...incDomainUrls] : incDomainUrls,
            tagUrls ? [...tagUrls] : tagUrls,
            listUrls ? [...listUrls] : listUrls,
        ].filter(urls => {
            return urls
        })

        let initInclude
        if (allUrls.length > 1) {
            initInclude = intersection(...allUrls)
        } else {
            initInclude = [...(incDomainUrls || []), ...(tagUrls || []), ...(listUrls || [])]
        }

        // const initInclude =
        //     incDomainUrls && tagUrls && listUrls
        //         ? [...incDomainUrls].filter(url => (tagUrls.has(url) && listUrls.has(url)))
        //         : [...(incDomainUrls || []), ...(tagUrls || []), ...(listUrls || [])]

        // Ensure no excluded URLs in included sets
        this.include = excDomainUrls
            ? new Set([...initInclude].filter(url => !excDomainUrls.has(url)))
            : new Set(initInclude)

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
    if (!lists || !lists.length) {
        return undefined
    }
    const customList = new CustomListBackground({ storageManager })

    const urls = new Set<string>()

    const listEnteries = await customList.fetchListPages(1)
    listEnteries.map(({ pageUrl }: any) => urls.add(pageUrl))

    return urls
}

/**
 * of URLs that match the filters to use as a white-list.
 */
export async function findFilteredUrls(
    params: Partial<SearchParams>,
): Promise<FilteredURLs> {
    const [incDomainUrls, excDomainUrls, tagUrls, listUrls] = await Promise.all([
        incDomainSearch(params),
        excDomainSearch(params),
        tagSearch(params),
        listSearch(params)
    ])

    return new FilteredURLsManager({ tagUrls, incDomainUrls, excDomainUrls, listUrls })
}
