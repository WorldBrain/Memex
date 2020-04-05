import { Tabs, Storage } from 'webextension-polyfill-ts'
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

import { Tag, SearchIndex } from 'src/search'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../../options/settings/constants'
import { AnnotationsListPlugin } from 'src/search/background/annots-list'
import { AnnotSearchParams } from 'src/search/background/types'
import { Annotation, AnnotListEntry } from '../types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import PageStorage from 'src/page-indexing/background/storage'

// TODO: Move to src/annotations in the future
export default class AnnotationStorage extends StorageModule {
    static PAGES_COLL = PAGE_COLLECTION_NAMES.page
    static ANNOTS_COLL = COLLECTION_NAMES.annotation
    static TAGS_COLL = TAG_COLLECTION_NAMES.tag
    static BMS_COLL = COLLECTION_NAMES.bookmark
    static LISTS_COLL = LIST_COLLECTION_NAMES.list
    static LIST_ENTRIES_COLL = COLLECTION_NAMES.listEntry

    private _browserStorageArea: Storage.StorageArea

    private db: Storex
    private searchIndex: SearchIndex

    constructor(
        private options: {
            storageManager: Storex
            browserStorageArea: Storage.StorageArea
            annotationsColl?: string
            pageStorage: PageStorage
            pagesColl?: string
            tagsColl?: string
            bookmarksColl?: string
            listsColl?: string
            listEntriesColl?: string
            searchIndex: SearchIndex
        },
    ) {
        super({ storageManager: options.storageManager })

        this.db = options.storageManager
        this.searchIndex = options.searchIndex
        this._browserStorageArea = options.browserStorageArea
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
        },
    })

    private async getListById({ listId }: { listId: number }) {
        const list = await this.db
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

    private async fetchIndexingPrefs(): Promise<{ shouldIndexLinks: boolean }> {
        const storage = await this._browserStorageArea.get(
            IDXING_PREF_KEYS.LINKS,
        )

        return {
            shouldIndexLinks: !!storage[IDXING_PREF_KEYS.LINKS],
        }
    }

    async indexPageFromTab({ id, url }: Tabs.Tab) {
        const indexingPrefs = await this.fetchIndexingPrefs()

        const page = await this.searchIndex.createPageFromTab({
            tabId: id,
            url,
            stubOnly: !indexingPrefs.shouldIndexLinks,
        })

        await this.options.pageStorage.createVisitsIfNeeded(page.url, [
            Date.now(),
        ])
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
    }: Annotation) {
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
        return this.operation('editAnnotation', { url, comment, lastEdited })
    }

    async deleteAnnotation(url: string) {
        return this.operation('deleteAnnotation', { url })
    }

    async getTagsByAnnotationUrl(url: string): Promise<Tag[]> {
        return this.db
            .collection(AnnotationStorage.TAGS_COLL)
            .findAllObjects<Tag>({ url })
    }

    private deleteTags = (query: { name: string; url: string }) =>
        this.db.collection(AnnotationStorage.TAGS_COLL).deleteObjects(query)

    private createTag = tag =>
        this.db.collection(AnnotationStorage.TAGS_COLL).createObject(tag)

    editAnnotationTags = async (
        tagsToBeAdded: string[],
        tagsToBeDeleted: string[],
        url: string,
    ) => {
        // Remove the tags that are to be deleted.
        await Promise.all(
            tagsToBeDeleted.map(async tag =>
                this.deleteTags({ name: tag, url }),
            ),
        )

        // Add the tags that are to be added.
        return Promise.all(
            tagsToBeAdded.map(async tag => this.createTag({ name: tag, url })),
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

    findListEntriesByUrl({ url }: { url: string }) {
        return this.operation('findListEntriesByUrl', { url })
    }
}
