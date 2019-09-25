import Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { COLLECTION_NAMES as TAG_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/tags/constants'
import { COLLECTION_NAMES as ANNOT_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/annotations/constants'

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
import { SuggestPlugin, SuggestType } from '../plugins/suggest'

export interface SearchStorageProps {
    storageManager: Storex
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

export default class SearchStorage extends StorageModule {
    static TAGS_COLL = TAG_COLLECTION_NAMES.tag
    static BMS_COLL = ANNOT_COLLECTION_NAMES.bookmark
    private legacySearch

    constructor({ storageManager, legacySearch }: SearchStorageProps) {
        super({ storageManager })

        this.legacySearch = legacySearch
    }

    getConfig = (): StorageModuleConfig => ({
        operations: {
            findAnnotBookmarksByUrl: {
                collection: SearchStorage.BMS_COLL,
                operation: 'findObjects',
                args: { url: { $in: '$annotUrls:string[]' } },
            },
            findAnnotTagsByUrl: {
                collection: SearchStorage.TAGS_COLL,
                operation: 'findObjects',
                args: [{ url: { $in: '$annotUrls:string[]' } }, { limit: 4 }],
            },
            searchAnnotsByDay: {
                operation: AnnotationsListPlugin.LIST_BY_DAY_OP_ID,
                args: ['$params:any'],
            },
            [PageUrlMapperPlugin.MAP_OP_SOCIAL_ID]: {
                operation: PageUrlMapperPlugin.MAP_OP_SOCIAL_ID,
                args: [
                    '$results:any',
                    {
                        base64Img: '$base64Img:boolean',
                        upperTimeBound: '$endDate:number',
                    },
                ],
            },
            [SocialSearchPlugin.MAP_POST_IDS_OP_ID]: {
                operation: SocialSearchPlugin.MAP_POST_IDS_OP_ID,
                args: ['$postIds:number[]'],
            },
            [SocialSearchPlugin.SEARCH_OP_ID]: {
                operation: SocialSearchPlugin.SEARCH_OP_ID,
                args: ['$params:any'],
            },
            [AnnotationsListPlugin.TERMS_SEARCH_OP_ID]: {
                operation: AnnotationsListPlugin.TERMS_SEARCH_OP_ID,
                args: ['$params:any'],
            },
            [PageUrlMapperPlugin.MAP_OP_ID]: {
                operation: PageUrlMapperPlugin.MAP_OP_ID,
                args: [
                    '$pageUrls:string[]',
                    {
                        base64Img: '$base64Img:boolean',
                        upperTimeBound: '$upperTimeBound:number',
                        latestTimes: '$latestTimes:number[]',
                    },
                ],
            },
            [SuggestPlugin.SUGGEST_OP_ID]: {
                operation: SuggestPlugin.SUGGEST_OP_ID,
                args: {
                    query: '$query:string',
                    type: '$type:string',
                    limit: '$limit:number',
                },
            },
            [SuggestPlugin.SUGGEST_EXT_OP_ID]: {
                operation: SuggestPlugin.SUGGEST_EXT_OP_ID,
                args: {
                    notInclude: '$notInclude:string[]',
                    type: '$type:string',
                    limit: '$limit:number',
                },
            },
        },
    })

    suggest = (args: { query: string; type: SuggestType; limit?: number }) =>
        this.operation(SuggestPlugin.SUGGEST_OP_ID, args)

    suggestExtended = (args: {
        notInclude?: string[]
        type: SuggestType
        limit?: number
    }) => this.operation(SuggestPlugin.SUGGEST_EXT_OP_ID, args)

    private async findAnnotsDisplayData(
        annotUrls: string[],
    ): Promise<{
        annotsToTags: Map<string, string[]>
        bmUrls: Set<string>
    }> {
        const bookmarks = await this.operation('findAnnotBookmarksByUrl', {
            annotUrls,
        })

        const bmUrls = new Set<string>(bookmarks.map(bm => bm.url))

        const tags = await this.operation('findAnnotTagsByUrl', { annotUrls })

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
        postPrefix = 'socialPosts:',
    ): Promise<AnnotPage[]> {
        const results: Map<string, any> = new Map()
        const pageIds: string[] = []
        const postIds: number[] = []

        // Split into post and page annots
        pageUrls.forEach(
            url =>
                url.startsWith(postPrefix)
                    ? postIds.push(Number(url.split(postPrefix)[1]))
                    : pageIds.push(url),
        )

        const pages: AnnotPage[] = await this.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            {
                pageUrls: pageIds,
                base64Img: params.base64Img,
                upperTimeBound: params.endDate,
            },
        )

        pages.forEach(page => results.set(page.url, page))

        const socialResults: Map<
            number,
            Map<string, SocialPage>
        > = await this.operation(SocialSearchPlugin.MAP_POST_IDS_OP_ID, {
            postIds,
        })

        const socialPages: SocialPage[] = await this.operation(
            PageUrlMapperPlugin.MAP_OP_SOCIAL_ID,
            {
                results: socialResults,
                base64Img: params.base64Img,
                upperTimeBound: params.endDate,
            },
        )

        socialPages.forEach(page =>
            results.set(postPrefix + page.id.toString(), page),
        )

        return pageUrls
            .map(url => {
                const result = results.get(url)

                if (!result) {
                    return
                }

                return {
                    ...result,
                    pageId: url,
                }
            })
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
        > = await this.operation('searchAnnotsByDay', { params })

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
        const validUrls = new Set(pages.map(page => page.pageId))
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
        const results: Map<string, Annotation[]> = await this.operation(
            AnnotationsListPlugin.TERMS_SEARCH_OP_ID,
            { params },
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
                const annotations = results.get(page.pageId).map(annot => ({
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

        return this.operation(PageUrlMapperPlugin.MAP_OP_ID, {
            pageUrls: ids.map(([url]) => url),
            upperTimeBound: params.endDate,
            base64Img: params.base64Img,
            latestTimes,
        })
    }

    async searchSocial(params: SocialSearchParams) {
        const results: Map<number, SocialPage> = await this.operation(
            SocialSearchPlugin.SEARCH_OP_ID,
            { params },
        )

        if (!results.size) {
            return []
        }

        return this.operation(PageUrlMapperPlugin.MAP_OP_SOCIAL_ID, {
            results,
            base64Img: params.base64Img,
            upperTimeBound: params.endDate,
        })
    }
}
