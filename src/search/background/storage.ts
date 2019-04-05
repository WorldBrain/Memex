import { StorageManager } from '..'
import { FeatureStorage } from '../storage'
import {
    SearchParams as OldSearchParams,
    SearchResult as OldSearchResult,
} from '../types'
import { AnnotSearchParams, AnnotPage, PageUrlsByDay } from './types'
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

    private async findAnnotsDisplayData(
        annotUrls: string[],
    ): Promise<{
        annotsToTags: Map<string, string[]>
        bmUrls: Set<string>
    }> {
        console.log(
            'starting annots data mapping for search results:',
            annotUrls,
        )
        const bookmarks = await this.storageManager
            .collection('annotBookmarks')
            .findAllObjects<Bookmark>({
                url: { $in: annotUrls },
            })

        const bmUrls = new Set(bookmarks.map(bm => bm.url))

        const tags = await this.storageManager
            .collection('tags')
            .findAllObjects<Tag>({ url: { $in: annotUrls } }, { limit: 4 })

        const annotsToTags = new Map<string, string[]>()

        tags.forEach(({ name, url }) => {
            const current = annotsToTags.get(url) || []
            annotsToTags.set(url, [...current, name])
        })

        return { annotsToTags, bmUrls }
    }

    /**
     * Searches for annotations which match the passed params and returns
     * them clustered by day.
     * @param params Annotation search params
     * @returns an object containing annotsByDay ( Timestamp as key and AnnotsByPageUrl as values )
     * and docs which is of type AnnotPage[].
     */
    private async searchAnnotsByDay(params: AnnotSearchParams) {
        console.time('annot search stage')
        const results: Map<
            number,
            Map<string, Annotation[]>
        > = await this.storageManager.operation(
            AnnotationsListPlugin.LIST_BY_DAY_OP_ID,
            params,
        )
        console.timeEnd('annot search stage')

        let pageUrls = new Set<string>()

        for (const [, annotsByPage] of results) {
            pageUrls = new Set([...pageUrls, ...annotsByPage.keys()])
        }

        console.time('display data mapping stage (TOTAL)')
        const pages: AnnotPage[] = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...pageUrls],
            { base64Img: params.base64Img, upperTimeBound: params.endDate },
        )
        console.timeEnd('display data mapping stage (TOTAL)')

        const clusteredResults: PageUrlsByDay = {}

        // Create reverse annots map pointing from each annot's PK to their data
        // related to which page, day cluster they belong to + display data.
        const reverseAnnotMap = new Map<string, [number, string, Annotation]>()
        for (const [day, annotsByPage] of results) {
            clusteredResults[day] = {}
            for (const [pageUrl, annots] of annotsByPage) {
                annots.forEach(annot =>
                    reverseAnnotMap.set(annot.url, [day, pageUrl, annot]),
                )
            }
        }

        console.time('annots display data mapping stage (TOTAL)')
        // Get display data for all annots then map them back to their clusters
        const { annotsToTags, bmUrls } = await this.findAnnotsDisplayData([
            ...reverseAnnotMap.keys(),
        ])
        console.timeEnd('annots display data mapping stage (TOTAL)')

        reverseAnnotMap.forEach(([day, pageUrl, annot]) => {
            const current = clusteredResults[day][pageUrl] || []
            clusteredResults[day][pageUrl] = [
                ...current,
                {
                    ...annot,
                    tags: annotsToTags.get(annot.url) || [],
                    hasBookmark: bmUrls.has(annot.url),
                } as any,
            ]
        })

        // Remove any annots without matching pages (keep data integrity regardless of DB)
        const validUrls = new Set(pages.map(page => page.url))
        for (const day of Object.keys(clusteredResults)) {
            for (const url of Object.keys(clusteredResults[day])) {
                if (!validUrls.has(url)) {
                    delete clusteredResults[day][url]
                }
            }
        }

        return {
            annotsByDay: clusteredResults,
            docs: pages,
        }
    }

    private async searchTermsAnnots(params: AnnotSearchParams) {
        console.time('annots search stage')
        const results: Map<
            string,
            Annotation[]
        > = await this.storageManager.operation(
            AnnotationsListPlugin.TERMS_SEARCH_OP_ID,
            params,
        )
        console.timeEnd('annots search stage')

        console.time('display data mapping stage (TOTAL)')
        const pages: AnnotPage[] = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            [...results.keys()],
            { base64Img: params.base64Img, upperTimeBound: params.endDate },
        )
        console.timeEnd('display data mapping stage (TOTAL)')

        const annotUrls = [].concat(...results.values()).map(annot => annot.url)

        console.time('annots display data mapping stage (TOTAL)')
        // Get display data for all annots then map them back to their clusters
        const { annotsToTags, bmUrls } = await this.findAnnotsDisplayData(
            annotUrls,
        )
        console.timeEnd('annots display data mapping stage (TOTAL)')

        return {
            docs: pages.map(page => {
                const annotations = results.get(page.url).map(annot => ({
                    ...annot,
                    tags: annotsToTags.get(annot.url) || [],
                    hasBookmark: bmUrls.has(annot.url),
                }))

                return { ...page, annotations }
            }),
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

        console.time('page search stage')
        const { ids } = await this.legacySearch(searchParams)
        console.timeEnd('page search stage')

        console.time('display data mapping stage (TOTAL)')
        const a = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            ids.map(([url]) => url),
            {
                upperTimeBound: params.endDate,
                latestTimes: ids.map(([, , time]) => time),
            },
        )

        console.timeEnd('display data mapping stage (TOTAL)')
        return a
    }
}
