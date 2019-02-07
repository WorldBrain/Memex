import { StorageManager, Page, FavIcon, Bookmark } from '..'
import { FeatureStorage } from '../storage'
import { AnnotSearchParams, AnnotPage } from './types'
import { Annotation } from 'src/direct-linking/types'

export interface SearchStorageProps {
    storageManager: StorageManager
    annotationsColl?: string
}

export default class SearchStorage extends FeatureStorage {
    static ANNOTS_COLL = 'annotations'

    private annotsColl: string

    private static buildAnnotsQuery({
        url,
        startDate,
        endDate,
    }: AnnotSearchParams): object {
        if (!url) {
            throw new Error('URL must be supplied to list annotations.')
        }

        const baseQuery = { pageUrl: url }
        let timeQuery = {}

        if (endDate || startDate) {
            const end = endDate ? { $lte: endDate } : {}
            const start = startDate ? { $gte: startDate } : {}
            timeQuery = { createdWhen: { ...end, ...start } }
        }

        return { ...baseQuery, ...timeQuery }
    }

    private static buildTagsQuery(
        { tagsInc = [], tagsExc = [] }: AnnotSearchParams,
        urls: string[],
    ): object {
        const baseQuery = { url: { $in: urls } }
        let tagsQuery = {}

        if (tagsInc.length || tagsExc.length) {
            const inc = tagsInc.length ? { $in: tagsInc } : {}
            const exc = tagsExc.length ? { $nin: tagsExc } : {}
            tagsQuery = { name: { ...inc, ...exc } }
        }

        return { ...baseQuery, ...tagsQuery }
    }

    static projectPageResults(results): AnnotPage[] {
        return results.map(page => ({
            url: page.url,
            title: page.fullTitle,
            hasBookmark: page.hasBookmark,
            screenshot: page.screenshot,
            favIcon: page.favIcon,
            annotations: [],
        }))
    }

    constructor({
        storageManager,
        annotationsColl = SearchStorage.ANNOTS_COLL,
    }: SearchStorageProps) {
        super(storageManager)

        this.annotsColl = annotationsColl
    }

    private async findMatchingPages(pageUrls: string[]) {
        const favIconMap = new Map<string, string>()
        const pageMap = new Map<string, Page>()

        await this.storageManager
            .collection('pages')
            .findObjects<Page>({ url: { $in: pageUrls } })
            .then(res =>
                res.forEach(page =>
                    pageMap.set(page.url, {
                        ...page,
                        screenshot: page.screenshot
                            ? URL.createObjectURL(page.screenshot)
                            : undefined,
                        hasBookmark: false, // Set later, if needed
                    } as any),
                ),
            )

        // Find all assoc. fav-icons and create object URLs
        const hostnames = new Set(
            [...pageMap.values()].map(page => page.hostname),
        )

        await this.storageManager
            .collection('favIcons')
            .findObjects<FavIcon>({ hostname: { $in: [...hostnames] } })
            .then(res =>
                res.forEach(fav =>
                    favIconMap.set(
                        fav.hostname,
                        URL.createObjectURL(fav.favIcon),
                    ),
                ),
            )

        // Find all assoc. bookmarks and augment assoc. page in page map
        await this.storageManager
            .collection('bookmarks')
            .findObjects<Bookmark>({ url: { $in: [...pageUrls] } })
            .then(res =>
                res.forEach(bm => {
                    const page = pageMap.get(bm.url)
                    pageMap.set(bm.url, { ...page, hasBookmark: true } as any)
                }),
            )

        // Map page results back to original input
        const pageResults = pageUrls.map(url => {
            const page = pageMap.get(url)

            return { ...page, favIcon: favIconMap.get(page.hostname) }
        })

        return SearchStorage.projectPageResults(pageResults)
    }

    public searchAnnots(params) {
        return this.storageManager.backend.operation(
            'memex:dexie.searchAnnotations',
            params,
            this.findMatchingPages.bind(this),
        )
    }

    private async filterByBookmarks(annots: Annotation[]) {
        const urls = annots.map(annot => annot.url)

        const results = await this.storageManager
            .collection('annotBookmarks')
            .findObjects<any>({ url: { $in: urls } })

        const resultSet = new Set(results.map(result => result.url))
        return annots.filter(annot => resultSet.has(annot.url))
    }

    private async filterByTags(
        annots: Annotation[],
        params: AnnotSearchParams,
    ) {
        const urls = annots.map(annot => annot.url)
        const query = SearchStorage.buildTagsQuery(params, urls)

        const results = await this.storageManager
            .collection('tags')
            .findObjects<any>(query)

        const resultSet = new Set(results.map(result => result.url))
        return annots.filter(annot => resultSet.has(annot.url))
    }

    private async filterByCollections(
        annots: Annotation[],
        { collections }: AnnotSearchParams,
    ) {
        const lists = await this.storageManager
            .collection('customLists')
            .findObjects<any>({ name: { $in: collections } })

        const results = await this.storageManager
            .collection('annotListEntries')
            .findObjects<any>({
                url: { $in: annots.map(annot => annot.url) },
                listId: { $in: lists.map(list => list.id) },
            })

        const resultSet = new Set(results.map(result => result.url))
        return annots.filter(annot => resultSet.has(annot.url))
    }

    async listAnnotations({
        limit = 10,
        skip = 0,
        ...params
    }: AnnotSearchParams): Promise<Annotation[]> {
        const innerLimit = limit * 2
        let innerSkip = 0
        let results: Annotation[] = []
        let continueLookup = true

        const query = SearchStorage.buildAnnotsQuery(params)

        while (continueLookup) {
            let innerResults = await this.storageManager
                .collection(this.annotsColl)
                .findObjects<Annotation>(query, {
                    skip: innerSkip,
                    limit: innerLimit,
                })

            // We've exhausted the DB results
            if (innerResults.length < innerLimit) {
                continueLookup = false
            }

            innerSkip += innerLimit

            if (params.bookmarksOnly) {
                innerResults = await this.filterByBookmarks(innerResults)
            }

            if (
                (params.tagsInc && params.tagsInc.length) ||
                (params.tagsExc && params.tagsExc.length)
            ) {
                innerResults = await this.filterByTags(innerResults, params)
            }

            if (params.collections && params.collections.length) {
                innerResults = await this.filterByCollections(
                    innerResults,
                    params,
                )
                return innerResults
            }

            results = [...results, ...innerResults]
        }

        return results
    }
}
