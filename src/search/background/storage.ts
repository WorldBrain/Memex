import type Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { COLLECTION_NAMES as TAG_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/tags/constants'
import { COLLECTION_NAMES as CONTENT_SHARE_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/content-sharing/client-storage'
import { COLLECTION_NAMES as ANNOT_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/annotations/constants'
import { COLLECTION_NAMES as LIST_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

import type {
    SearchParams as OldSearchParams,
    SearchResult as OldSearchResult,
} from '../types'
import type {
    AnnotSearchParams,
    AnnotPage,
    PageUrlsByDay,
    SocialSearchParams,
} from './types'
import { PageUrlMapperPlugin } from './page-url-mapper'
import { reshapeParamsForOldSearch } from './utils'
import { AnnotationsListPlugin } from './annots-list'
import { SocialSearchPlugin } from './social-search'
import type { SocialPage } from 'src/social-integration/types'
import { SuggestPlugin, SuggestType } from '../plugins/suggest'
import type { Annotation, AnnotListEntry } from 'src/annotations/types'
import { getAnnotationPrivacyState } from '@worldbrain/memex-common/lib/content-sharing/utils'
import type {
    AnnotationPrivacyLevel,
    SharedListMetadata,
} from 'src/content-sharing/background/types'
import type { PageListEntry } from 'src/custom-lists/background/types'

export interface SearchStorageProps {
    storageManager: Storex
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

export default class SearchStorage extends StorageModule {
    static TAGS_COLL = TAG_COLLECTION_NAMES.tag
    static ANNOTS_COLL = ANNOT_COLLECTION_NAMES.annotation
    static ANNOT_LISTS_ENTRIES_COLL = ANNOT_COLLECTION_NAMES.listEntry
    static PAGE_LISTS_ENTRIES_COLL = LIST_COLLECTION_NAMES.listEntry
    static LISTS_COLL = LIST_COLLECTION_NAMES.list
    static ANNOT_PRIVACY_LEVELS_COLL =
        CONTENT_SHARE_COLLECTION_NAMES.annotationPrivacy
    static LIST_METADATA_LEVELS_COLL =
        CONTENT_SHARE_COLLECTION_NAMES.listMetadata
    static BMS_COLL = ANNOT_COLLECTION_NAMES.bookmark

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
                args: [{ url: { $in: '$annotUrls:string[]' } }],
            },
            findAnnotListEntriesByUrls: {
                collection: SearchStorage.ANNOT_LISTS_ENTRIES_COLL,
                operation: 'findObjects',
                args: [{ url: { $in: '$annotUrls:string[]' } }],
            },
            findPageListEntriesByUrls: {
                collection: SearchStorage.PAGE_LISTS_ENTRIES_COLL,
                operation: 'findObjects',
                args: [{ pageUrl: { $in: '$urls:string[]' } }],
            },
            findAnnotPrivacyLevelsByUrls: {
                collection: SearchStorage.ANNOT_PRIVACY_LEVELS_COLL,
                operation: 'findObjects',
                args: [{ annotation: { $in: '$urls:string[]' } }],
            },
            findAnnotationsByUrls: {
                collection: SearchStorage.ANNOTS_COLL,
                operation: 'findObjects',
                args: [{ url: { $in: '$urls:string[]' } }],
            },
            findListMetadataByIds: {
                collection: SearchStorage.LIST_METADATA_LEVELS_COLL,
                operation: 'findObjects',
                args: [{ localId: { $in: '$listIds:string[]' } }],
            },
            findListById: {
                collection: SearchStorage.LISTS_COLL,
                operation: 'findObject',
                args: { id: '$id:pk' },
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
        annotsToLists: Map<string, number[]>
        bmUrls: Set<string>
    }> {
        const privacyLevels: AnnotationPrivacyLevel[] = await this.operation(
            'findAnnotPrivacyLevelsByUrls',
            { urls: annotUrls },
        )
        const bookmarks = await this.operation('findAnnotBookmarksByUrl', {
            annotUrls,
        })

        const pageUrlToAnnotUrls = new Map<string, string[]>()
        const annotsToLists = new Map<string, number[]>()

        // Public annotations inherit shared lists from their parent pages, so we need to look them up differently
        const publicAnnotUrls = privacyLevels
            .filter(
                (level) => getAnnotationPrivacyState(level.privacyLevel).public,
            )
            .map((level) => level.annotation)

        if (publicAnnotUrls.length > 0) {
            const publicAnnotations: Annotation[] = await this.operation(
                'findAnnotationsByUrls',
                { urls: publicAnnotUrls },
            )

            publicAnnotations.forEach(({ url, pageUrl }) => {
                const prev = pageUrlToAnnotUrls.get(pageUrl) ?? []
                pageUrlToAnnotUrls.set(pageUrl, [...prev, url])
            })

            const pageListEntries: PageListEntry[] = await this.operation(
                'findPageListEntriesByUrls',
                { urls: [...pageUrlToAnnotUrls.keys()] },
            )
            const sharedListMetadata: SharedListMetadata[] = await this.operation(
                'findListMetadataByIds',
                { listIds: [...pageListEntries.map((entry) => entry.listId)] },
            )
            const sharedListIds = new Set(
                sharedListMetadata.map((meta) => meta.localId),
            )

            pageListEntries.forEach(({ listId, pageUrl }) => {
                // Only concerned with shared lists
                if (!sharedListIds.has(listId)) {
                    return
                }

                const annotUrls = pageUrlToAnnotUrls.get(pageUrl) ?? []
                for (const annotUrl of annotUrls) {
                    const prev = annotsToLists.get(annotUrl) ?? []
                    annotsToLists.set(annotUrl, [...prev, listId])
                }
            })
        }

        const bmUrls = new Set<string>(bookmarks.map((bm) => bm.url))

        const tags = await this.operation('findAnnotTagsByUrl', { annotUrls })
        const annotsToTags = new Map<string, string[]>()

        tags.forEach(({ name, url }) => {
            const current = annotsToTags.get(url) ?? []
            annotsToTags.set(url, [...current, name])
        })

        const annotListEntries: AnnotListEntry[] = await this.operation(
            'findAnnotListEntriesByUrls',
            {
                annotUrls,
            },
        )

        annotListEntries.forEach(({ listId, url }) => {
            const current = annotsToLists.get(url) ?? []
            annotsToLists.set(url, [...current, listId])
        })

        return { annotsToTags, annotsToLists, bmUrls }
    }

    private async getMergedAnnotsPages(
        pageUrls: string[],
        params: AnnotSearchParams,
    ): Promise<AnnotPage[]> {
        const results = new Map<string, any>()

        const pages: AnnotPage[] = await this.operation(
            PageUrlMapperPlugin.MAP_OP_ID,
            {
                pageUrls,
                upperTimeBound: params.endDate,
            },
        )

        pages.forEach((page) => results.set(page.url, page))

        return pageUrls
            .map((url) => {
                const result = results.get(url)

                if (!result) {
                    return
                }

                return {
                    ...result,
                    pageId: url,
                }
            })
            .filter((page) => page !== undefined)
    }

    private mergedAnnotsPagesToAnnotsById(
        pages: AnnotPage[],
    ): Map<string, Annotation> {
        const results = new Map()
        pages.forEach((page) =>
            page.annotations.forEach((annot) => results.set(annot.url, annot)),
        )
        return results
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
        const annotationsById = this.mergedAnnotsPagesToAnnotsById(pages)

        const clusteredResults: PageUrlsByDay = {}

        // Create reverse annots map pointing from each annot's PK to their data
        // related to which page, day cluster they belong to + display data.
        const reverseAnnotMap = new Map<string, [number, string, Annotation]>()
        for (const [day, annotsByPage] of results) {
            clusteredResults[day] = {}
            for (const [pageUrl, annots] of annotsByPage) {
                annots.forEach((annot) =>
                    reverseAnnotMap.set(annot.url, [
                        day,
                        pageUrl,
                        annotationsById.get(annot.url),
                    ]),
                )
            }
        }

        // Get display data for all annots then map them back to their clusters
        const {
            annotsToTags,
            annotsToLists,
            bmUrls,
        } = await this.findAnnotsDisplayData([...reverseAnnotMap.keys()])

        reverseAnnotMap.forEach(([day, pageUrl, annot]) => {
            // Delete any annots containing excluded tags
            const tags = annotsToTags.get(annot.url) ?? []
            const lists = annotsToLists.get(annot.url) ?? []

            // Skip current annot if contains filtered tags
            if (
                params.tagsExc &&
                params.tagsExc.length &&
                params.tagsExc.some((tag) => tags.includes(tag))
            ) {
                return
            }

            const currentAnnots = clusteredResults[day][pageUrl] ?? []
            clusteredResults[day][pageUrl] = [
                ...currentAnnots,
                {
                    ...annot,
                    tags,
                    lists,
                    hasBookmark: bmUrls.has(annot.url),
                } as any,
            ]
        })

        // Remove any annots without matching pages (keep data integrity regardless of DB)
        const validUrls = new Set(pages.map((page) => page.pageId))
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
            {
                params,
            },
        )

        const pages: AnnotPage[] = await this.getMergedAnnotsPages(
            [...results.keys()],
            params,
        )
        const annotationsById = this.mergedAnnotsPagesToAnnotsById(pages)

        const annotUrls = []
            .concat(...results.values())
            .map((annot) => annot.url)

        // Get display data for all annots then map them back to their clusters
        const {
            annotsToTags,
            annotsToLists,
            bmUrls,
        } = await this.findAnnotsDisplayData(annotUrls)

        return {
            docs: pages.map((page) => {
                const annotations = results.get(page.pageId).map((annot) => ({
                    ...annotationsById.get(annot.url),
                    tags: annotsToTags.get(annot.url) ?? [],
                    lists: annotsToLists.get(annot.url) ?? [],
                    hasBookmark: bmUrls.has(annot.url),
                }))

                return { ...page, annotations }
            }),
        }
    }

    async searchAnnots(
        params: AnnotSearchParams,
    ): Promise<{ docs: AnnotPage[]; annotsByDay?: PageUrlsByDay }> {
        if (!params.termsInc || !params.termsInc.length) {
            return this.searchAnnotsByDay(params)
        }
        return this.searchTermsAnnots(params)
    }

    async searchSocial(params: SocialSearchParams) {
        const results: Map<
            number,
            SocialPage
        > = await this.operation(SocialSearchPlugin.SEARCH_OP_ID, { params })

        if (!results.size) {
            return []
        }

        return this.operation(PageUrlMapperPlugin.MAP_OP_SOCIAL_ID, {
            results,
            upperTimeBound: params.endDate,
        })
    }
}
