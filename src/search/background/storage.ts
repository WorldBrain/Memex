import { StorageManager } from '..'
import { FeatureStorage } from '../storage'
import {
    SearchParams as OldSearchParams,
    SearchResult as OldSearchResult,
} from '../types'
import { AnnotSearchParams, AnnotPage } from './types'
import { Annotation } from 'src/direct-linking/types'
import { PageUrlMapperPlugin } from './page-url-mapper'
import { reshapeAnnotForDisplay, reshapeParamsForOldSearch } from './utils'
import { AnnotationsSearchPlugin } from './annots-search'
import { AnnotationsListPlugin } from './annots-list'
import { Tag, Bookmark } from 'src/search/models'

export interface SearchStorageProps {
    storageManager: StorageManager
    annotationsColl?: string
}

export interface Interaction {
    time: number
    url: string
}

export type LegacySearch = (
    params: OldSearchParams,
) => Promise<{
    ids: OldSearchResult[]
    totalCount: number
}>

export default class SearchStorage extends FeatureStorage {
    constructor({ storageManager }: SearchStorageProps) {
        super(storageManager)
    }

    private async calcLatestInteraction(url: string, upperTimeBound?: number) {
        let max = 0
        const visitQuery: any = { url }
        const bmQuery: any = { url }

        if (upperTimeBound) {
            visitQuery.time = { $lte: upperTimeBound }
            bmQuery.time = { $lte: upperTimeBound }
        }

        const [visits, bookmark] = await Promise.all([
            this.storageManager
                .collection('visits')
                .findObjects<Interaction>(visitQuery),
            this.storageManager
                .collection('bookmarks')
                .findOneObject<Interaction>(bmQuery),
        ])

        max = visits.sort((a, b) => b.time - a.time)[0].time

        if (!!bookmark && bookmark.time > max) {
            max = bookmark.time
        }

        return max
    }

    private async attachDisplayDataToAnnots(
        annots: Annotation[],
    ): Promise<Annotation[]> {
        const bookmarks = await this.storageManager
            .collection('annotBookmarks')
            .findAllObjects<Bookmark>({
                url: { $in: annots.map(annot => annot.url) },
            })

        const bmUrls = new Set(bookmarks.map(bm => bm.url))

        return Promise.all(
            annots.map(async annot => {
                const tags = await this.storageManager
                    .collection('tags')
                    .findAllObjects<Tag>({ url: annot.url }, { limit: 4 })

                return {
                    ...annot,
                    tags: tags.map(tag => tag.name),
                    hasBookmark: bmUrls.has(annot.url),
                }
            }),
        )
    }

    private async attachDisplayTimeToPages(
        pages: AnnotPage[],
        endDate: Date | number,
    ): Promise<AnnotPage[]> {
        return Promise.all(
            pages.map(async page => {
                const upperTimeBound =
                    endDate instanceof Date ? endDate.getTime() : endDate

                return {
                    ...page,
                    displayTime: await this.calcLatestInteraction(
                        page.url,
                        upperTimeBound,
                    ),
                }
            }),
        )
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

        const pages = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...pageUrls],
        )

        return pages.map(page => ({
            ...page,
            annotations: annotsByUrl.get(page.url),
        }))
    }

    async searchPagesByLatestAnnotation(params: AnnotSearchParams) {
        let results = await this.storageManager.operation(
            AnnotationsListPlugin.LIST_OP_ID,
            params,
        )

        results = await this.attachDisplayDataToAnnots(results)

        const pages = await this.mapAnnotsToPages(
            results,
            params.maxAnnotsPerPage ||
                AnnotationsSearchPlugin.MAX_ANNOTS_PER_PAGE,
        )

        return this.attachDisplayTimeToPages(pages, params.endDate)
    }

    async listAnnotations(params: AnnotSearchParams): Promise<Annotation[]> {
        const results: Annotation[] = await this.storageManager.operation(
            AnnotationsListPlugin.LIST_BY_PAGE_OP_ID,
            params,
        )

        return this.attachDisplayDataToAnnots(results)
    }

    async searchAnnots(
        params: AnnotSearchParams,
    ): Promise<Annotation[] | AnnotPage[]> {
        let results: Annotation[] = await this.storageManager.operation(
            AnnotationsSearchPlugin.SEARCH_OP_ID,
            params,
        )

        results = await this.attachDisplayDataToAnnots(results)

        if (params.includePageResults) {
            const pages = await this.mapAnnotsToPages(
                results,
                params.maxAnnotsPerPage ||
                    AnnotationsSearchPlugin.MAX_ANNOTS_PER_PAGE,
            )

            return this.attachDisplayTimeToPages(pages, params.endDate)
        }

        return results.map(reshapeAnnotForDisplay as any) as any
    }

    async searchPages(
        params: AnnotSearchParams,
        legacySearch: LegacySearch,
    ): Promise<AnnotPage[]> {
        const searchParams = reshapeParamsForOldSearch(params)

        const { ids } = await legacySearch(searchParams)

        const pageUrls = new Set(ids.map(([url]) => url))

        const pages = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...pageUrls],
        )

        return this.attachDisplayTimeToPages(pages, params.endDate)
    }
}
