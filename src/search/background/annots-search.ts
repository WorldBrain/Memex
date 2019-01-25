import { Page, Tag } from 'src/search'
import { Annotation } from 'src/direct-linking/types'
import { AnnotSearchParams, UrlFilters, AnnotPage } from './types'
import { Searcher } from './searcher'

const uniqBy = require('lodash/fp/uniqBy')

export class AnnotsSearcher extends Searcher<AnnotSearchParams, any> {
    static MEMEX_LINK_PROVIDERS = [
        'http://memex.link',
        'http://staging.memex.link',
    ]

    private annotsColl: string
    private listsColl: string
    private listEntriesColl: string
    private tagsColl: string
    private pagesColl: string
    private bookmarksColl: string
    private linkProviders: string[]

    private static projectAnnotSearchResults(results): Annotation[] {
        return results.map(
            ({
                url,
                pageUrl,
                body,
                comment,
                createdWhen,
                tags,
                hasBookmark,
            }) => ({
                url,
                pageUrl,
                body,
                comment,
                createdWhen,
                tags: tags.map(tag => tag.name),
                hasBookmark,
            }),
        )
    }

    private static uniqAnnots: (annots: Annotation[]) => Annotation[] = uniqBy(
        'url',
    )

    private static applyUrlFilters(
        query,
        {
            collUrlsInc,
            domainUrlsInc,
            domainUrlsExc,
            tagUrlsInc,
            tagUrlsExc,
        }: UrlFilters,
    ) {
        let pageUrlInc: string[]

        if (collUrlsInc != null && collUrlsInc.size) {
            pageUrlInc = [...collUrlsInc]

            query.url = {
                $in: pageUrlInc,
                ...(query.pageUrl || {}),
            }
        }

        if (domainUrlsInc != null && domainUrlsInc.size) {
            // Intersect inc. domain URLs and inc. collection URLs, if both defined
            pageUrlInc =
                pageUrlInc != null
                    ? [
                          ...new Set(
                              pageUrlInc.filter(url => domainUrlsInc.has(url)),
                          ),
                      ]
                    : [...domainUrlsInc]

            query.pageUrl = {
                $in: pageUrlInc,
                ...(query.pageUrl || {}),
            }
        }

        if (domainUrlsExc != null && domainUrlsExc.size) {
            query.pageUrl = {
                $nin: [...domainUrlsExc],
                ...(query.pageUrl || {}),
            }
        }

        if (tagUrlsInc != null && tagUrlsInc.size) {
            query.url = { $in: [...tagUrlsInc], ...(query.url || {}) }
        }

        if (tagUrlsExc != null && tagUrlsExc.size) {
            query.url = { $nin: [...tagUrlsExc], ...(query.url || {}) }
        }
    }

    constructor({
        storageManager,
        annotsColl,
        listsColl,
        listEntriesColl,
        tagsColl,
        bookmarksColl,
        pagesColl,
        linkProviders = AnnotsSearcher.MEMEX_LINK_PROVIDERS,
    }) {
        super(storageManager)
        this.annotsColl = annotsColl
        this.listsColl = listsColl
        this.listEntriesColl = listEntriesColl
        this.tagsColl = tagsColl
        this.pagesColl = pagesColl
        this.bookmarksColl = bookmarksColl
        this.linkProviders = linkProviders
    }

    // TODO: Find better way of calculating this?
    private isAnnotDirectLink = (annot: Annotation) => {
        let isDirectLink = false

        for (const provider of this.linkProviders) {
            isDirectLink = isDirectLink || annot.url.startsWith(provider)
        }

        return isDirectLink
    }

    private async mapAnnotsToPages(annots: Annotation[]): Promise<AnnotPage[]> {
        const pageUrls = new Set(annots.map(annot => annot.pageUrl))

        const annotsByUrl = new Map<string, Annotation[]>()

        for (const annot of annots) {
            const pageAnnots = annotsByUrl.get(annot.pageUrl) || []
            annotsByUrl.set(annot.pageUrl, [...pageAnnots, annot])
        }

        const pages = await this.findMatchingPages([...pageUrls])

        return pages.map(page => ({
            ...page,
            annotations: annotsByUrl.get(page.url),
        }))
    }

    private async collectionSearch(collections: string[]) {
        if (!collections.length) {
            return undefined
        }

        const colls = await this.storageManager
            .collection(this.listsColl)
            .findObjects<any>({ name: { $in: collections } })

        const collEntries = await this.storageManager
            .collection(this.listEntriesColl)
            .findObjects<any>({ listId: { $in: colls.map(coll => coll.id) } })

        return new Set<string>(collEntries.map(coll => coll.url))
    }

    private async tagSearch(tags: string[]) {
        if (!tags.length) {
            return undefined
        }

        const tagResults = await this.storageManager
            .collection(this.tagsColl)
            .findObjects<Tag>({ name: { $in: tags } })

        return new Set<string>(tagResults.map(tag => tag.url))
    }

    private async domainSearch(domains: string[]) {
        if (!domains.length) {
            return undefined
        }

        const pages = await this.storageManager
            .collection(this.pagesColl)
            .findObjects<Page>({
                $or: [
                    { hostname: { $in: domains } },
                    { domain: { $in: domains } },
                ],
            })

        return new Set<string>(pages.map(page => page.url))
    }

    private async mapSearchResToBookmarks(
        { bookmarksOnly = false }: AnnotSearchParams,
        results: Annotation[],
    ) {
        const bookmarks = await this.storageManager
            .collection(this.bookmarksColl)
            .findObjects<any>({
                url: { $in: results.map(annot => annot.url) },
            })

        const bmUrlSet = new Set(bookmarks.map(bm => bm.url))

        if (bookmarksOnly) {
            results = results.filter(annot => bmUrlSet.has(annot.url))
        }

        return results.map(annot => ({
            ...annot,
            hasBookmark: bmUrlSet.has(annot.pageUrl),
        }))
    }

    /**
     * I don't know why this is the only way I can get this working...
     * I originally intended a simpler single query like:
     *  { $or: [_body_terms: term, _comment_terms: term] }
     */
    private termSearch = (
        {
            endDate = Date.now(),
            startDate = 0,
            limit = 5,
            url,
            includeHighlights = true,
            includeNotes = true,
            includeDirectLinks = true,
        }: Partial<AnnotSearchParams>,
        urlFilters: UrlFilters,
    ) => async (term: string) => {
        const termSearchField = async (field: string) => {
            const query: any = {
                [field]: { $all: [term] },
                createdWhen: {
                    $lte: endDate,
                    $gte: startDate,
                },
            }

            AnnotsSearcher.applyUrlFilters(query, urlFilters)

            if (url != null && url.length) {
                query.pageUrl = url
            }

            const results = await this.storageManager
                .collection(this.annotsColl)
                .findObjects<Annotation>(query, { limit })

            return !includeDirectLinks
                ? results.filter(res => !this.isAnnotDirectLink(res))
                : results
        }

        const bodyRes = includeHighlights
            ? await termSearchField('_body_terms')
            : []
        const commentsRes = includeNotes
            ? await termSearchField('_comment_terms')
            : []

        return AnnotsSearcher.uniqAnnots([...bodyRes, ...commentsRes]).slice(
            0,
            limit,
        )
    }

    async search({
        termsInc = [],
        tagsInc = [],
        tagsExc = [],
        domainsInc = [],
        domainsExc = [],
        collections = [],
        limit = 5,
        includePageResults = false,
        ...searchParams
    }: AnnotSearchParams): Promise<Annotation[] | AnnotPage[]> {
        const filters: UrlFilters = {
            collUrlsInc: await this.collectionSearch(collections),
            tagUrlsInc: await this.tagSearch(tagsInc),
            tagUrlsExc: await this.tagSearch(tagsExc),
            domainUrlsInc: await this.domainSearch(domainsInc),
            domainUrlsExc: await this.domainSearch(domainsExc),
        }

        // If domains/tags/collections filters were specified but no matches, search fails early
        if (
            (filters.domainUrlsInc != null &&
                filters.domainUrlsInc.size === 0) ||
            (filters.tagUrlsInc != null && filters.tagUrlsInc.size === 0) ||
            (filters.collUrlsInc != null && filters.collUrlsInc.size === 0)
        ) {
            return []
        }

        const termResults = await Promise.all(
            termsInc.map(this.termSearch({ ...searchParams, limit }, filters)),
        )

        // Flatten out results
        let annotResults = AnnotsSearcher.uniqAnnots(
            [].concat(...termResults),
        ).slice(0, limit)

        annotResults = await this.mapSearchResToBookmarks(
            searchParams,
            annotResults,
        )

        // Lookup tags for each annotation
        annotResults = await Promise.all(
            annotResults.map(async annot => {
                const tags = await this.storageManager
                    .collection(this.tagsColl)
                    .findObjects({ url: annot.url })
                return { ...annot, tags }
            }),
        )

        if (includePageResults) {
            return this.mapAnnotsToPages(annotResults)
        }

        // Project out unwanted data
        return AnnotsSearcher.projectAnnotSearchResults(annotResults)
    }
}
