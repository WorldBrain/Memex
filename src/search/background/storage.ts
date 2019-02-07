import { StorageManager } from '..'
import { FeatureStorage } from '../storage'
import {
    SearchParams as OldSearchParams,
    SearchResult as OldSearchResult,
} from '../types'
import { AnnotSearchParams, AnnotPage } from './types'
import { Annotation } from 'src/direct-linking/types'
import { AnnotationsSearchPlugin } from './annots-search'
import { PageUrlMapperPlugin } from './page-url-mapper'
import { reshapeAnnotForDisplay, reshapeParamsForOldSearch } from './utils'

export interface SearchStorageProps {
    storageManager: StorageManager
    annotationsColl?: string
}

export type LegacySearch = (
    params: OldSearchParams,
) => Promise<{
    ids: OldSearchResult[]
    totalCount: number
}>

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

    private async mapAnnotsToPages(
        annots: Annotation[],
        maxAnnotsPerPage: number,
    ): Promise<AnnotPage[]> {
        const pageUrls = new Set(annots.map(annot => annot.pageUrl))
        const annotsByUrl = new Map<string, Annotation[]>()

        for (const annot of annots) {
            const pageAnnots = annotsByUrl.get(annot.pageUrl) || []
            annotsByUrl.set(
                annot.pageUrl,
                [...pageAnnots, annot].slice(0, maxAnnotsPerPage),
            )
        }

        const pages = await this.storageManager.backend.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...pageUrls],
        )

        return pages.map(page => ({
            ...page,
            annotations: annotsByUrl.get(page.url),
        }))
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

    async searchAnnots(
        params: AnnotSearchParams,
    ): Promise<Annotation[] | AnnotPage[]> {
        const results: Annotation[] = await this.storageManager.backend.operation(
            AnnotationsSearchPlugin.SEARCH_OP_ID,
            params,
        )

        if (params.includePageResults) {
            return this.mapAnnotsToPages(
                results,
                params.maxAnnotsPerPage ||
                    AnnotationsSearchPlugin.MAX_ANNOTS_PER_PAGE,
            )
        }

        return results.map(reshapeAnnotForDisplay as any) as any
    }

    async searchPages(params: AnnotSearchParams, legacySearch: LegacySearch) {
        const searchParams = reshapeParamsForOldSearch(params)

        const { ids } = await legacySearch(searchParams)

        const pageUrls = new Set(ids.map(([url]) => url))

        return this.storageManager.backend.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...pageUrls],
        )
    }
}
