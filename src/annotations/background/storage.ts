import Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-storage/lib/annotations/constants'
import { COLLECTION_NAMES as PAGE_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/pages/constants'
import { COLLECTION_NAMES as TAG_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/tags/constants'
import { COLLECTION_NAMES as LIST_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/lists/constants'

import { Tag } from 'src/search'
import { AnnotationsListPlugin } from 'src/search/background/annots-list'
import { AnnotSearchParams } from 'src/search/background/types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { Annotation, AnnotListEntry } from 'src/annotations/types'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

export default class AnnotationStorage extends StorageModule {
    static PAGES_COLL = PAGE_COLLECTION_NAMES.page
    static ANNOTS_COLL = COLLECTION_NAMES.annotation
    static TAGS_COLL = TAG_COLLECTION_NAMES.tag
    static BMS_COLL = COLLECTION_NAMES.bookmark
    static LISTS_COLL = LIST_COLLECTION_NAMES.list
    static LIST_ENTRIES_COLL = COLLECTION_NAMES.listEntry

    constructor(private options: { storageManager: Storex }) {
        super({ storageManager: options.storageManager })
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
            findListEntriesByUrl: {
                collection: AnnotationStorage.LIST_ENTRIES_COLL,
                operation: 'findObjects',
                args: { url: '$url:pk' },
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
            listAnnotationBookmarksForAnnotations: {
                collection: AnnotationStorage.BMS_COLL,
                operation: 'findObjects',
                args: { url: { $in: '$annotationUrls:string[]' } },
            },
        },
    })

    async getAnnotations(urls: string[]): Promise<Annotation[]> {
        return this.operation('findAnnotationsByUrls', { urls })
    }

    async listAnnotationsByPageUrl({
        pageUrl,
        withTags,
        withBookmarks,
    }: {
        pageUrl: string
        withTags?: boolean
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

        if (annotationsTagMap.size > 0 || annotationsBookmarkMap.size > 0) {
            annotations.forEach((annotation) => {
                annotation.tags = annotationsTagMap.get(annotation.url) ?? []
                annotation.isBookmarked =
                    annotationsBookmarkMap.get(annotation.url) ?? false
            })
        }

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

    private async getListById({ listId }: { listId: number }) {
        const list = await this.options.storageManager
            .collection(AnnotationStorage.LISTS_COLL)
            .findOneObject<{ id: number }>({ id: listId })

        if (list == null) {
            throw new Error(`No list exists for ID: ${listId}`)
        }

        return list.id
    }

    async insertAnnotToList({ listId, url }: AnnotListEntry) {
        await this.getListById({ listId })

        const { object } = await this.operation('createAnnotationForList', {
            listId,
            url,
            createdAt: new Date(),
        })

        return [object.listId, object.url]
    }

    async removeAnnotFromList({ listId, url }: AnnotListEntry) {
        await this.getListById({ listId })

        await this.operation('deleteAnnotationFromList', { listId, url })
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

    async getAnnotationByPk(url: string): Promise<Annotation> {
        return this.operation('findAnnotationByUrl', { url })
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
        createdWhen = new Date(),
    }: Omit<Annotation, 'tags'>) {
        if (!body?.length && !comment?.length) {
            throw new Error(
                'Failed create annotation attempt - no highlight or comment supplied',
            )
        }

        return this.operation('createAnnotation', {
            pageTitle,
            pageUrl,
            comment,
            body,
            selector,
            createdWhen,
            lastEdited: createdWhen,
            url,
        })
    }

    async editAnnotation(
        url: string,
        comment: string,
        lastEdited = new Date(),
    ) {
        return this.operation('editAnnotation', {
            url,
            comment,
            lastEdited: new Date(),
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
}
