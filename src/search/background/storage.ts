import { StorageManager } from '..'
import { FeatureStorage } from '../storage'
import {
    SearchParams as OldSearchParams,
    SearchResult as OldSearchResult,
} from '../types'
import {
    AnnotSearchParams,
    AnnotPage,
    PageUrlsByDay,
    PagesByUrl,
    AnnotsByPageUrl,
} from './types'
import { Annotation } from 'src/direct-linking/types'
import { PageUrlMapperPlugin } from './page-url-mapper'
import { reshapeParamsForOldSearch } from './utils'
import { AnnotationsListPlugin } from './annots-list'
import { Tag, Bookmark } from 'src/search/models'

export interface SearchStorageProps {
    storageManager: StorageManager
    annotationsColl?: string
    legacySearch: (params: any) => Promise<any>
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
    private legacySearch

    constructor({ storageManager, legacySearch }: SearchStorageProps) {
        super(storageManager)

        this.legacySearch = legacySearch
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

    async searchAnnotsByDay(params: AnnotSearchParams) {
        const results: Map<
            number,
            Map<string, Annotation[]>
        > = await this.storageManager.operation(
            AnnotationsListPlugin.LIST_BY_DAY_OP_ID,
            params,
        )

        const normalizedResults: PageUrlsByDay = {}
        const pagesByUrl: PagesByUrl = {}

        for (const [day, annotsByPage] of results) {
            const updatedAnnotsByPage: AnnotsByPageUrl = {}

            const pageUrlAnnots = (await Promise.all(
                [...annotsByPage].map(async ([pageUrl, annots]) => [
                    pageUrl,
                    await this.attachDisplayDataToAnnots(annots),
                ]),
            )) as [string, Annotation[]][]

            pageUrlAnnots.forEach(([pageUrl, annots]) => {
                updatedAnnotsByPage[pageUrl] = annots
            })

            normalizedResults[day] = updatedAnnotsByPage

            let pages: AnnotPage[] = await this.storageManager.operation(
                PageUrlMapperPlugin.MAP_OP_ID,
                [...annotsByPage.keys()],
            )

            pages = await this.attachDisplayTimeToPages(pages, params.endDate)

            pages.forEach(page => {
                pagesByUrl[page.url] = page
            })
        }

        return [normalizedResults, pagesByUrl]
    }

    async listAnnotations(params: AnnotSearchParams): Promise<Annotation[]> {
        const results: Annotation[] = await this.storageManager.operation(
            AnnotationsListPlugin.LIST_BY_PAGE_OP_ID,
            params,
        )

        return this.attachDisplayDataToAnnots(results)
    }

    // TODO: Hook into annotations search to enable this without the clustering
    async searchAnnots(
        params: AnnotSearchParams,
    ): Promise<Annotation[] | AnnotPage[]> {
        // let results: Annotation[] = await this.storageManager.operation(
        //     AnnotationsSearchPlugin.SEARCH_OP_ID,
        //     params,
        // )

        // results = await this.attachDisplayDataToAnnots(results)

        // if (params.includePageResults) {
        //     const pages = await this.mapAnnotsToPages(
        //         results,
        //         params.maxAnnotsPerPage ||
        //             AnnotationsSearchPlugin.MAX_ANNOTS_PER_PAGE,
        //     )

        //     return this.attachDisplayTimeToPages(pages, params.endDate)
        // }

        // return results.map(reshapeAnnotForDisplay as any) as any
        return []
    }

    async searchPages(params: AnnotSearchParams): Promise<AnnotPage[]> {
        const searchParams = reshapeParamsForOldSearch(params)

        const { ids } = await this.legacySearch(searchParams)

        const pageUrls = new Set(ids.map(([url]) => url))

        const pages = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...pageUrls],
        )

        return this.attachDisplayTimeToPages(pages, params.endDate)
    }
}
