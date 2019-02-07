import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { Annotation } from 'src/direct-linking/types'
import { AnnotSearchParams, UrlFilters, AnnotPage } from './types'

const uniqBy = require('lodash/fp/uniqBy')

export class AnnotationsSearchPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static SEARCH_OP_ID = 'memex:dexie.searchAnnotations'
    static MAX_ANNOTS_PER_PAGE = 9

    private annotsColl = 'annotations'
    private listsColl = 'customLists'
    private listEntriesColl = 'annotListEntries'
    private tagsColl = 'tags'
    private pagesColl = 'pages'
    private bookmarksColl = 'annotBookmarks'
    private linkProviders = ['http://memex.link', 'http://staging.memex.link']

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

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            AnnotationsSearchPlugin.SEARCH_OP_ID,
            this.search.bind(this),
        )
    }

    // TODO: Find better way of calculating this?
    private isAnnotDirectLink = (annot: Annotation) => {
        let isDirectLink = false

        for (const provider of this.linkProviders) {
            isDirectLink = isDirectLink || annot.url.startsWith(provider)
        }

        return isDirectLink
    }

    private async collectionSearch(collections: string[]) {
        if (!collections.length) {
            return undefined
        }

        const collIds = await this.backend.dexieInstance
            .table(this.listsColl)
            .where('name')
            .anyOf(collections)
            .primaryKeys()

        const collEntries = await this.backend.dexieInstance
            .table(this.listEntriesColl)
            .where('listId')
            .anyOf(collIds)
            .primaryKeys()

        return new Set<string>(collEntries.map(([, url]) => url))
    }

    private async tagSearch(tags: string[]) {
        if (!tags.length) {
            return undefined
        }

        const tagResults = await this.backend.dexieInstance
            .table(this.tagsColl)
            .where('name')
            .anyOf(tags)
            .primaryKeys()

        return new Set<string>(tagResults.map(([, url]) => url))
    }

    private async domainSearch(domains: string[]) {
        if (!domains.length) {
            return undefined
        }

        const pages = await this.backend.dexieInstance
            .collection(this.pagesColl)
            .find({
                $or: [
                    { hostname: { $in: domains } },
                    { domain: { $in: domains } },
                ],
            })
            .uniqueKeys()

        return new Set(pages as string[])
    }

    private async mapSearchResToBookmarks(
        { bookmarksOnly = false }: AnnotSearchParams,
        results: Annotation[],
    ) {
        const bmUrls = new Set<string>()
        await this.backend.dexieInstance
            .table(this.bookmarksColl)
            .where('url')
            .anyOf(results.map(annot => annot.url))
            .eachPrimaryKey(url => bmUrls.add(url))

        if (bookmarksOnly) {
            results = results.filter(annot => bmUrls.has(annot.url))
        }

        return results.map(annot => ({
            ...annot,
            hasBookmark: bmUrls.has(annot.pageUrl),
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

            AnnotationsSearchPlugin.applyUrlFilters(query, urlFilters)

            if (url != null && url.length) {
                query.pageUrl = url
            }

            const results = await this.backend.dexieInstance
                .collection<any>(this.annotsColl)
                .find(query)
                .limit(limit)
                .toArray()

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

        return AnnotationsSearchPlugin.uniqAnnots([
            ...bodyRes,
            ...commentsRes,
        ]).slice(0, limit)
    }

    async search({
        termsInc = [],
        tagsInc = [],
        tagsExc = [],
        domainsInc = [],
        domainsExc = [],
        collections = [],
        limit = 5,
        ...searchParams
    }: AnnotSearchParams): Promise<Annotation[]> {
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
        let annotResults = AnnotationsSearchPlugin.uniqAnnots(
            [].concat(...termResults),
        ).slice(0, limit)

        annotResults = await this.mapSearchResToBookmarks(
            searchParams,
            annotResults,
        )

        // Lookup tags for each annotation
        return Promise.all(
            annotResults.map(async annot => {
                const tagKeys = await this.backend.dexieInstance
                    .table(this.tagsColl)
                    .where('url')
                    .equals(annot.url)
                    .primaryKeys()

                return { ...annot, tags: tagKeys.map(([name]) => name) }
            }),
        )
    }
}
