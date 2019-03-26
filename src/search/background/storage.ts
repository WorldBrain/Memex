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

    /**
     * Searches for annotations which match the passed params and returns
     * them clustered by day.
     * @param params Annotation search params
     * @returns an object containing annotsByDay ( Timestamp as key and AnnotsByPageUrl as values )
     * and docs which is of type AnnotPage[].
     */
    private async searchAnnotsByDay(params: AnnotSearchParams) {
        const results: Map<
            number,
            Map<string, Annotation[]>
        > = await this.storageManager.operation(
            AnnotationsListPlugin.LIST_BY_DAY_OP_ID,
            params,
        )

        let pageUrls = new Set<string>()

        for (const [, annotsByPage] of results) {
            pageUrls = new Set([...pageUrls, ...annotsByPage.keys()])
        }

        let pages: AnnotPage[] = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...pageUrls],
            params.base64Img,
        )

        pages = await this.attachDisplayTimeToPages(pages, params.endDate)

        const normalizedResults: PageUrlsByDay = {}

        for (const [day, annotsByPage] of results) {
            normalizedResults[day] = {}
            for (const [pageUrl, annots] of annotsByPage) {
                normalizedResults[day][
                    pageUrl
                ] = await this.attachDisplayDataToAnnots(annots)
            }
        }

        // Remove any annots without matching pages (keep data integrity regardless of DB)
        const validUrls = new Set(pages.map(page => page.url))
        for (const day of Object.keys(normalizedResults)) {
            for (const url of Object.keys(normalizedResults[day])) {
                if (!validUrls.has(url)) {
                    delete normalizedResults[day][url]
                }
            }
        }

        return {
            annotsByDay: normalizedResults,
            docs: pages,
        }
    }

    private async searchTermsAnnots(params: AnnotSearchParams) {
        const results: Map<
            string,
            Annotation[]
        > = await this.storageManager.operation(
            AnnotationsListPlugin.TERMS_SEARCH_OP_ID,
            params,
        )

        let pages: AnnotPage[] = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...results.keys()],
            params.base64Img,
        )

        pages = await this.attachDisplayTimeToPages(pages, params.endDate)

        return {
            docs: pages.map(page => ({
                ...page,
                annotations: results.get(page.url),
            })),
        }
    }

    async searchAnnots(params: AnnotSearchParams) {
        if (!params.termsInc || !params.termsInc.length) {
            return this.searchAnnotsByDay(params)
        }
        return this.searchTermsAnnots(params)
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
