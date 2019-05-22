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
    SocialSearchParams,
} from './types'
import { Annotation } from 'src/direct-linking/types'
import { PageUrlMapperPlugin } from './page-url-mapper'
import { reshapeParamsForOldSearch } from './utils'
import { AnnotationsListPlugin } from './annots-list'
import { SocialSearchPlugin } from './social-search'
import { SocialPage } from 'src/social-integration/types'
import { buildTweetUrl } from 'src/social-integration/util'
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

    async getMergedAnnotsPages(
        pageUrls: string[],
        params: AnnotSearchParams,
    ): Promise<AnnotPage[]> {
        const results: Map<string, any> = new Map()

        const pages: AnnotPage[] = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            pageUrls,
            { base64Img: params.base64Img, upperTimeBound: params.endDate },
        )

        pages.forEach(page => results.set(page.url, page))

        const socialResults: Map<
            number,
            Map<string, SocialPage>
        > = await this.storageManager.operation(
            SocialSearchPlugin.MAP_URLS_OP_ID,
            pageUrls,
        )

        const socialPages: SocialPage[] = await this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_SOCIAL_ID,
            socialResults,
            { base64Img: params.base64Img, upperTimeBound: params.endDate },
        )

        socialPages.map(page => results.set(page.id.toString(), page))

        return pageUrls
            .map(url => results.get(url))
            .filter(page => page !== undefined)
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

        const pages: AnnotPage[] = await this.getMergedAnnotsPages(
            [...pageUrls],
            params,
        )

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

        // Get display data for all annots then map them back to their clusters
        const { annotsToTags, bmUrls } = await this.findAnnotsDisplayData([
            ...reverseAnnotMap.keys(),
        ])

        reverseAnnotMap.forEach(([day, pageUrl, annot]) => {
            // Delete any annots containing excluded tags
            const tags = annotsToTags.get(annot.url) || []

            // Skip current annot if contains filtered tags
            if (
                params.tagsExc &&
                params.tagsExc.length &&
                params.tagsExc.some(tag => tags.includes(tag))
            ) {
                return
            }

            const current = clusteredResults[day][pageUrl] || []
            clusteredResults[day][pageUrl] = [
                ...current,
                {
                    ...annot,
                    tags,
                    hasBookmark: bmUrls.has(annot.url),
                } as any,
            ]
        })

        // Remove any annots without matching pages (keep data integrity regardless of DB)
        const validUrls = new Set(pages.map(page => page.url))
        for (const day of Object.keys(clusteredResults)) {
            // Remove any empty days (they might have had all annots filtered out due to excluded tags)
            if (!Object.keys(clusteredResults[day]).length) {
                delete clusteredResults[day]
                continue
            }

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
        const results: Map<
            string,
            Annotation[]
        > = await this.storageManager.operation(
            AnnotationsListPlugin.TERMS_SEARCH_OP_ID,
            params,
        )

        const pages: AnnotPage[] = await this.getMergedAnnotsPages(
            [...results.keys()],
            params,
        )

        const annotUrls = [].concat(...results.values()).map(annot => annot.url)

        // Get display data for all annots then map them back to their clusters
        const { annotsToTags, bmUrls } = await this.findAnnotsDisplayData(
            annotUrls,
        )

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

        const { ids } = await this.legacySearch(searchParams)

        if (!ids.length) {
            return []
        }

        // Terms search requires lookup of the latest interaction times for scoring,
        //  so it returns triples. The 3rd index is the latest time (to avoid redoing those queries).
        const latestTimes =
            ids[0].length === 3 ? ids.map(([, , time]) => time) : undefined

        return this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            ids.map(([url]) => url),
            {
                upperTimeBound: params.endDate,
                latestTimes,
                base64Img: params.base64Img,
            },
        )
    }

    async searchSocial(params: SocialSearchParams) {
        const results: Map<
            number,
            SocialPage
        > = await this.storageManager.operation(
            SocialSearchPlugin.SEARCH_OP_ID,
            params,
        )

        if (!results.size) {
            return []
        }

        return this.storageManager.operation(
            PageUrlMapperPlugin.MAP_OP_SOCIAL_ID,
            results,
            { base64Img: params.base64Img, upperTimeBound: params.endDate },
        )
    }
}
