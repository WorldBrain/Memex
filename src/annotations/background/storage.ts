import Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-common/lib/storage/modules/annotations/constants'
import { COLLECTION_NAMES as PAGE_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/pages/constants'
import { COLLECTION_NAMES as TAG_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/tags/constants'
import { COLLECTION_NAMES as LIST_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

import type { Tag } from 'src/search'
import { AnnotationsListPlugin } from 'src/search/background/annots-list'
import type { AnnotSearchParams } from 'src/search/background/types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import type { Annotation, AnnotListEntry } from 'src/annotations/types'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import type { PKMSyncBackgroundModule } from 'src/pkm-integrations/background'
import { shareAnnotationWithPKM } from 'src/pkm-integrations/background/backend/utils'
import { isPkmSyncEnabled } from 'src/pkm-integrations/utils'
import type { Storage } from 'webextension-polyfill'

export default class AnnotationStorage extends StorageModule {
    static PAGES_COLL = PAGE_COLLECTION_NAMES.page
    static ANNOTS_COLL = COLLECTION_NAMES.annotation
    static TAGS_COLL = TAG_COLLECTION_NAMES.tag
    static BMS_COLL = COLLECTION_NAMES.bookmark
    static LISTS_COLL = LIST_COLLECTION_NAMES.list
    static LIST_ENTRIES_COLL = COLLECTION_NAMES.listEntry

    constructor(
        private options: {
            storageManager: Storex
            /** Please do not add new references to this. Access to be refactored to a higher level. */
            ___storageAPI: Storage.Static
            pkmSyncBG: PKMSyncBackgroundModule
        },
    ) {
        super({
            storageManager: options.storageManager,
        })
    }

    getConfig = (): StorageModuleConfig => ({
        collections: {
            ...COLLECTION_DEFINITIONS,
            // NOTE: This is no longer used; keeping to maintain DB schema sanity
            directLinks: {
                version: STORAGE_VERSIONS[4].version,
                fields: {
                    pageTitle: { type: 'text' },
                    pageUrl: { type: 'url' },
                    body: { type: 'text' },
                    comment: { type: 'text' },
                    selector: { type: 'json' },
                    createdWhen: { type: 'datetime' },
                    lastEdited: { type: 'datetime' },
                    url: { type: 'string' },
                },
                indices: [
                    { field: 'url', pk: true },
                    { field: 'pageTitle' },
                    { field: 'pageUrl' },
                    { field: 'body' },
                    { field: 'createdWhen' },
                    { field: 'comment' },
                ],
                history: [
                    {
                        version: STORAGE_VERSIONS[1].version,
                        fields: {
                            pageTitle: { type: 'text' },
                            pageUrl: { type: 'url' },
                            body: { type: 'text' },
                            selector: { type: 'json' },
                            createdWhen: { type: 'datetime' },
                            url: { type: 'string' },
                        },
                        indices: [
                            { field: 'url', pk: true },
                            { field: 'pageTitle' },
                            { field: 'body' },
                            { field: 'createdWhen' },
                        ],
                    },
                ],
            },
        },
        operations: {
            findBookmarkByUrl: {
                collection: AnnotationStorage.BMS_COLL,
                operation: 'findObject',
                args: { url: '$url:pk' },
            },
            findAnnotationByUrl: {
                collection: AnnotationStorage.ANNOTS_COLL,
                operation: 'findObject',
                args: { url: '$url:pk' },
            },
            findAnnotationsByUrls: {
                collection: AnnotationStorage.ANNOTS_COLL,
                operation: 'findObjects',
                args: { url: { $in: '$urls:array:pk' } },
            },
            findListEntry: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'findObject',
                args: { url: '$url:pk', listId: '$listId:pk' },
            },
            findListEntriesByUrl: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'findObjects',
                args: { url: '$url:pk' },
            },
            findListEntriesByUrls: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'findObjects',
                args: { url: { $in: '$urls:pk' } },
            },
            findListEntriesByList: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'findObjects',
                args: { listId: '$listId:pk' },
            },
            createAnnotationForList: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'createObject',
            },
            createBookmark: {
                collection: AnnotationStorage.BMS_COLL,
                operation: 'createObject',
            },
            createAnnotation: {
                collection: AnnotationStorage.ANNOTS_COLL,
                operation: 'createObject',
            },
            editAnnotation: {
                collection: AnnotationStorage.ANNOTS_COLL,
                operation: 'updateObject',
                args: [
                    { url: '$url:pk' },
                    {
                        comment: '$comment:string',
                        color: '$color:string',
                        body: '$body:string',
                        lastEdited: '$lastEdited:any',
                    },
                ],
            },
            deleteAnnotation: {
                collection: AnnotationStorage.ANNOTS_COLL,
                operation: 'deleteObject',
                args: { url: '$url:pk' },
            },
            deleteAnnotationFromList: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'deleteObjects',
                args: { listId: '$listId:int', url: '$url:string' },
            },
            deleteAnnotationEntriesByList: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'deleteObjects',
                args: { listId: '$listId:int' },
            },
            deleteListEntriesByUrl: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'deleteObjects',
                args: { url: '$url:string' },
            },
            deleteBookmarkByUrl: {
                collection: AnnotationStorage.BMS_COLL,
                operation: 'deleteObject',
                args: { url: '$url:pk' },
            },
            deleteTagsByUrl: {
                collection: AnnotationStorage.TAGS_COLL,
                operation: 'deleteObjects',
                args: { url: '$url:pk' },
            },
            listAnnotsByPage: {
                operation: AnnotationsListPlugin.LIST_BY_PAGE_OP_ID,
                args: ['$params:any'],
            },
            listAnnotationsByPageUrl: {
                collection: AnnotationStorage.ANNOTS_COLL,
                operation: 'findObjects',
                args: { pageUrl: '$pageUrl:string' },
            },
            listAnnotationIdsByColor: {
                collection: AnnotationStorage.ANNOTS_COLL,
                operation: 'findObjects',
                args: { color: '$color:string' },
            },
            listAnnotationsByPageUrls: {
                collection: AnnotationStorage.ANNOTS_COLL,
                operation: 'findObjects',
                args: { pageUrl: { $in: '$pageUrls:array:string' } },
            },
            listAnnotationTagsForAnnotations: {
                collection: AnnotationStorage.TAGS_COLL,
                operation: 'findObjects',
                args: { url: { $in: '$annotationUrls:string[]' } },
            },
            listAnnotationListsForAnnotations: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'findObjects',
                args: { url: { $in: '$annotationUrls:string[]' } },
            },
            listAnnotationBookmarksForAnnotations: {
                collection: AnnotationStorage.BMS_COLL,
                operation: 'findObjects',
                args: { url: { $in: '$annotationUrls:string[]' } },
            },
            findListById: {
                collection: AnnotationStorage.LISTS_COLL,
                operation: 'findObject',
                args: { id: '$id:pk' },
            },
        },
    })

    async getAnnotations(urls: string[]): Promise<Annotation[]> {
        return this.operation('findAnnotationsByUrls', { urls })
    }

    async listAnnotationsByPageUrl({
        pageUrl,
        withTags,
        withLists,
        withBookmarks,
    }: {
        pageUrl: string
        withTags?: boolean
        withLists?: boolean
        withBookmarks?: boolean
    }) {
        pageUrl = normalizeUrl(pageUrl)

        const annotations: Annotation[] = await this.operation(
            'listAnnotationsByPageUrl',
            { pageUrl },
        )

        // Efficiently query and join Bookmarks and Tags from their respective collections
        const annotationUrls = annotations.map((annotation) => annotation.url)
        let annotationsBookmarkMap = new Map<string, boolean>()
        let annotationsTagMap = new Map<string, string[]>()
        let annotationsListMap = new Map<string, number[]>()

        if (withBookmarks !== false) {
            annotationsBookmarkMap = new Map(
                (
                    await this.operation(
                        'listAnnotationBookmarksForAnnotations',
                        { annotationUrls },
                    )
                ).map((result) => [result.url, result]),
            )
        }

        if (withTags !== false) {
            const annotationTags: Tag[] = await this.operation(
                'listAnnotationTagsForAnnotations',
                {
                    annotationUrls,
                },
            )
            annotationsTagMap = new Map()

            for (const tag of annotationTags) {
                const prev = annotationsTagMap.get(tag.url) ?? []
                annotationsTagMap.set(tag.url, [...prev, tag.name])
            }
        }

        if (withLists !== false) {
            const listEntries: AnnotListEntry[] = await this.operation(
                'listAnnotationListsForAnnotations',
                {
                    annotationUrls,
                },
            )

            annotationsListMap = new Map()
            for (const entry of listEntries) {
                const prev = annotationsListMap.get(entry.url) ?? []
                annotationsListMap.set(entry.url, [...prev, entry.listId])
            }
        }

        annotations.forEach((annotation) => {
            annotation.tags = annotationsTagMap.get(annotation.url) ?? []
            annotation.isBookmarked =
                annotationsBookmarkMap.get(annotation.url) ?? false
            annotation.lists = annotationsListMap.get(annotation.url) ?? []
        })

        return annotations
    }

    async listAnnotationsByPageUrls({ pageUrls }: { pageUrls: string[] }) {
        pageUrls = pageUrls.map((url) => normalizeUrl(url))

        const annotations: Annotation[] = await this.operation(
            'listAnnotationsByPageUrls',
            { pageUrls },
        )

        return annotations
    }
    async listAnnotationIdsByColor(color: string) {
        const annotations = await this.operation('listAnnotationIdsByColor', {
            color,
        })

        return annotations
    }

    private async getListById({ listId }: { listId: number }) {
        const list = await this.options.storageManager
            .collection(AnnotationStorage.LISTS_COLL)
            .findOneObject<{ id: number }>({ id: listId })

        if (list == null) {
            throw new Error(`No list exists for ID: ${listId}`)
        }

        return list.id
    }

    async insertAnnotToList(
        { listId, url }: AnnotListEntry,
        opts?: { skipListExistenceCheck?: boolean },
    ) {
        if (!opts?.skipListExistenceCheck) {
            await this.getListById({ listId })
        }

        await this.operation('createAnnotationForList', {
            listId,
            url,
            createdAt: new Date(),
        })

        // Send to PKM Sync
        try {
            if (
                await isPkmSyncEnabled({
                    storageAPI: this.options.___storageAPI,
                })
            ) {
                const annotationsData = await this.getAnnotations([url])
                const annotationDataForPKMSyncUpdate = annotationsData[0]
                const listData = await this.options.storageManager
                    .collection(AnnotationStorage.LISTS_COLL)
                    .findOneObject<{ id: number; name: string }>({ id: listId })
                const listName = listData.name

                const pageVisitStorage = await this.options.storageManager
                    .collection('visits')
                    .findOneObject<{ time: string }>({
                        url: normalizeUrl(
                            annotationDataForPKMSyncUpdate.pageUrl,
                        ),
                    })
                const pageDate = pageVisitStorage.time

                const pageDataStorage = await this.options.storageManager
                    .collection('pages')
                    .findOneObject<{ fullUrl: string }>({
                        url: normalizeUrl(
                            annotationDataForPKMSyncUpdate.pageUrl,
                        ),
                    })

                const annotationData = {
                    annotationId: annotationDataForPKMSyncUpdate.url,
                    pageTitle: annotationDataForPKMSyncUpdate.pageTitle,
                    pageUrl:
                        pageDataStorage.fullUrl ??
                        'https://' + annotationDataForPKMSyncUpdate.pageUrl,
                    annotationSpaces: listName,
                    pageCreatedWhen: pageDate,
                    body: annotationsData[0]?.body,
                    comment: annotationsData[0]?.comment,
                    createdWhen: annotationsData[0]?.createdWhen,
                }

                shareAnnotationWithPKM(
                    annotationData,
                    this.options.pkmSyncBG,
                    async (url, listNames) =>
                        await this.checkIfAnnotationInfilteredList({
                            url: url,
                            listNames: listNames,
                        }),
                )
            }
        } catch (e) {}
    }

    async ensureAnnotInList(
        { listId, url }: AnnotListEntry,
        opts?: { skipListExistenceCheck?: boolean },
    ) {
        const existing = await this.operation('findListEntry', { listId, url })
        if (!existing) {
            await this.insertAnnotToList({ listId, url }, opts)
        }
    }

    async removeAnnotsFromList(params: { listId: number }): Promise<void> {
        await this.operation('deleteAnnotationEntriesByList', {
            listId: params.listId,
        })
    }

    async removeAnnotFromList({ listId, url }: AnnotListEntry) {
        await this.getListById({ listId })

        await this.operation('deleteAnnotationFromList', { listId, url })

        try {
            if (
                await isPkmSyncEnabled({
                    storageAPI: this.options.___storageAPI,
                })
            ) {
                const annotationsData = await this.getAnnotations([url])
                const annotationDataForPKMSyncUpdate = annotationsData[0]
                const listData = await this.options.storageManager
                    .collection(AnnotationStorage.LISTS_COLL)
                    .findOneObject<{ id: number; name: string }>({ id: listId })
                const listName = listData.name

                const pageDataStorage = await this.options.storageManager
                    .collection('visits')
                    .findOneObject<{ time: string }>({
                        url: normalizeUrl(
                            annotationDataForPKMSyncUpdate.pageUrl,
                        ),
                    })
                const pageDate = pageDataStorage.time

                const annotationData = {
                    annotationId: annotationDataForPKMSyncUpdate.url,
                    pageTitle: annotationDataForPKMSyncUpdate.pageTitle,
                    pageUrl: annotationDataForPKMSyncUpdate.pageUrl,
                    annotationSpaces: listName,
                    pageCreatedWhen: pageDate,
                    body: annotationsData[0]?.body,
                    comment: annotationsData[0]?.comment,
                    createdWhen: annotationsData[0]?.createdWhen,
                }

                shareAnnotationWithPKM(annotationData, this.options.pkmSyncBG)
            }
        } catch (e) {}
    }

    /**
     * @returns Promise resolving to a boolean denoting whether or not a bookmark was created.
     */
    async toggleAnnotBookmark({ url }: { url: string }) {
        const bookmark = await this.operation('findBookmarkByUrl', { url })

        if (bookmark == null) {
            await this.operation('createBookmark', {
                url,
                createdAt: new Date(),
            })
            return true
        }

        await this.operation('deleteBookmarkByUrl', { url })
        return false
    }

    async deleteBookmarkByUrl({ url }: { url: string }) {
        return this.operation('deleteBookmarkByUrl', { url })
    }

    async annotHasBookmark({ url }: { url: string }) {
        const bookmark = await this.operation('findBookmarkByUrl', { url })
        return bookmark != null
    }

    async updateAnnotationBookmark({
        url,
        isBookmarked,
    }: {
        url: string
        isBookmarked: boolean
    }) {
        const existingBookmark = await this.operation('findBookmarkByUrl', {
            url,
        })
        if (!!existingBookmark !== isBookmarked) {
            return isBookmarked
                ? this.operation('createBookmark', {
                      url,
                      createdAt: new Date(),
                  })
                : this.operation('deleteBookmarkByUrl', { url })
        }
    }

    async getAnnotationByPk({ url }: { url: string }) {
        if (url.length > 0) {
            const annotation = this.operation('findAnnotationByUrl', { url })
            return annotation
        }
    }

    async getAllAnnotationsByUrl(params: AnnotSearchParams) {
        const results: Annotation[] = await this.operation('listAnnotsByPage', {
            params,
        })
        return results
    }

    async createAnnotation({
        pageTitle,
        pageUrl,
        body,
        url,
        comment,
        selector,
        color,
        userId,
        createdWhen = new Date(),
    }: Omit<Annotation, 'tags' | 'lists'>) {
        if (!body?.length && !comment?.length) {
            throw new Error(
                'Failed create annotation attempt - no highlight or comment supplied',
            )
        }
        try {
            if (
                await isPkmSyncEnabled({
                    storageAPI: this.options.___storageAPI,
                })
            ) {
                const pageVisitStorage = await this.options.storageManager
                    .collection('visits')
                    .findOneObject<{ time: string }>({
                        url: normalizeUrl(url),
                    })
                const pageDate = pageVisitStorage?.time ?? createdWhen

                const pageDataStorage = await this.options.storageManager
                    .collection('pages')
                    .findOneObject<{ fullUrl: string }>({
                        url: normalizeUrl(url),
                    })

                const annotationData = {
                    annotationId: url,
                    pageTitle: pageTitle,
                    body: body ?? '',
                    comment: comment ?? '',
                    createdWhen: createdWhen.getTime(),
                    color: color ?? null,
                    pageCreatedWhen: pageDate,
                    pageUrl: pageDataStorage?.fullUrl ?? pageUrl,
                }

                shareAnnotationWithPKM(annotationData, this.options.pkmSyncBG)
            }
        } catch (e) {}
        return this.operation('createAnnotation', {
            pageTitle,
            pageUrl,
            comment,
            body,
            selector,
            color,
            createdWhen,
            lastEdited: createdWhen,
            url,
        })
    }

    async checkIfAnnotationInfilteredList({
        url,
        listNames,
    }: {
        url: string
        listNames: string[]
    }): Promise<boolean> {
        const listEntries = await this.operation('findListEntriesByUrl', {
            url: url,
        })

        if (listEntries.length === 0) {
            return false
        }

        for (const listEntry of listEntries) {
            const listData = await this.operation('findListById', {
                id: listEntry.listId,
            })
            const listName = listData.name

            if (listNames.includes(listName)) {
                return true
            }
        }
    }

    async editAnnotation(
        url: string,
        comment: string,
        color: string,
        body: string,
        lastEdited = new Date(),
        userId?: string,
    ) {
        try {
            if (
                await isPkmSyncEnabled({
                    storageAPI: this.options.___storageAPI,
                })
            ) {
                const annotationsData = await this.getAnnotations([url])
                const annotationDataForPKMSyncUpdate = annotationsData[0]

                const pageVisitStorage = await this.options.storageManager
                    .collection('visits')
                    .findOneObject<{ time: string }>({
                        url: normalizeUrl(
                            annotationDataForPKMSyncUpdate.pageUrl,
                        ),
                    })
                const pageDate = pageVisitStorage.time

                const pageDataStorage = await this.options.storageManager
                    .collection('pages')
                    .findOneObject<{ fullUrl: string }>({
                        url: normalizeUrl(
                            annotationDataForPKMSyncUpdate.pageUrl,
                        ),
                    })

                const annotationData = {
                    annotationId: annotationDataForPKMSyncUpdate.url,
                    pageTitle: annotationDataForPKMSyncUpdate.pageTitle,
                    body: body ?? annotationDataForPKMSyncUpdate.body,
                    createdWhen: annotationDataForPKMSyncUpdate.createdWhen,
                    comment,
                    pageCreatedWhen: pageDate,
                    pageUrl:
                        pageDataStorage.fullUrl ??
                        'https://' + annotationDataForPKMSyncUpdate.pageUrl,
                }

                shareAnnotationWithPKM(
                    annotationData,
                    this.options.pkmSyncBG,
                    async (url, listNames) =>
                        await this.checkIfAnnotationInfilteredList({
                            url: url,
                            listNames: listNames,
                        }),
                )
            }
        } catch (e) {}

        return this.operation('editAnnotation', {
            url,
            comment,
            color,
            body,
            lastEdited,
        })
    }

    async deleteAnnotation(url: string) {
        return this.operation('deleteAnnotation', { url })
    }

    async getTagsByAnnotationUrl(url: string): Promise<Tag[]> {
        return this.options.storageManager
            .collection(AnnotationStorage.TAGS_COLL)
            .findAllObjects<Tag>({ url })
    }

    private deleteTags = (query: { name: string; url: string }) =>
        this.options.storageManager
            .collection(AnnotationStorage.TAGS_COLL)
            .deleteObjects(query)

    private createTag = (tag) =>
        this.options.storageManager
            .collection(AnnotationStorage.TAGS_COLL)
            .createObject(tag)

    editAnnotationTags = async (
        tagsToBeAdded: string[],
        tagsToBeDeleted: string[],
        url: string,
    ) => {
        // Remove the tags that are to be deleted.
        await Promise.all(
            tagsToBeDeleted.map(async (tag) =>
                this.deleteTags({ name: tag, url }),
            ),
        )

        // Add the tags that are to be added.
        return Promise.all(
            tagsToBeAdded.map(async (tag) =>
                this.createTag({ name: tag, url }),
            ),
        )
    }

    modifyTags = (shouldAdd: boolean) => async (name: string, url: string) => {
        if (shouldAdd) {
            return this.createTag({ name, url })
        } else {
            return this.deleteTags({ name, url })
        }
    }

    deleteTagsByUrl({ url }: { url: string }) {
        return this.operation('deleteTagsByUrl', { url })
    }

    deleteListEntriesByUrl({ url }: { url: string }) {
        return this.operation('deleteListEntriesByUrl', { url })
    }

    findListEntriesByUrl({ url }: { url: string }): Promise<AnnotListEntry[]> {
        return this.operation('findListEntriesByUrl', { url })
    }

    async findListEntriesByList(args: {
        listId: number
    }): Promise<AnnotListEntry[]> {
        const listEntries: AnnotListEntry[] = await this.operation(
            'findListEntriesByList',
            { listId: args.listId },
        )
        return listEntries
    }

    async findListEntriesByUrls({
        annotationUrls,
    }: {
        annotationUrls: string[]
    }): Promise<{ [annotationUrl: string]: AnnotListEntry[] }> {
        const listEntries: AnnotListEntry[] = await this.operation(
            'findListEntriesByUrls',
            { urls: annotationUrls },
        )
        const listEntriesByAnnot: {
            [annotationUrl: string]: AnnotListEntry[]
        } = {}

        for (const entry of listEntries) {
            const prev = listEntriesByAnnot[entry.url] ?? []
            listEntriesByAnnot[entry.url] = [...prev, entry]
        }

        return listEntriesByAnnot
    }
}
