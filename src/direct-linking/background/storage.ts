import { browser, Tabs, Storage } from 'webextension-polyfill-ts'

import { createPageFromTab, Tag, Dexie, StorageManager } from '../../search'
import { FeatureStorage } from '../../search/storage'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../../options/settings/constants'
import { Annotation, AnnotListEntry } from '../types'

export interface AnnotationStorageProps {
    storageManager: StorageManager
    getDb: () => Promise<Dexie>
    browserStorageArea?: Storage.StorageArea
    annotationsColl?: string
    pagesColl?: string
    tagsColl?: string
    bookmarksColl?: string
    listsColl?: string
    listEntriesColl?: string
}

// TODO: Move to src/annotations in the future
export default class AnnotationStorage extends FeatureStorage {
    static ANNOTS_COLL = 'annotations'
    static TAGS_COLL = 'tags'
    static BMS_COLL = 'annotBookmarks'
    static LISTS_COLL = 'customLists'
    static LIST_ENTRIES_COLL = 'annotListEntries'

    private _browserStorageArea: Storage.StorageArea
    private _getDb: () => Promise<Dexie>
    private _annotationsColl: string
    private _bookmarksColl: string
    private _tagsColl: string
    private _listsColl: string
    private _listEntriesColl: string

    constructor({
        storageManager,
        getDb,
        browserStorageArea = browser.storage.local,
        annotationsColl = AnnotationStorage.ANNOTS_COLL,
        bookmarksColl = AnnotationStorage.BMS_COLL,
        tagsColl = AnnotationStorage.TAGS_COLL,
        listsColl = AnnotationStorage.LISTS_COLL,
        listEntriesColl = AnnotationStorage.LIST_ENTRIES_COLL,
    }: AnnotationStorageProps) {
        super(storageManager)

        this._annotationsColl = annotationsColl
        this._tagsColl = tagsColl
        this._bookmarksColl = bookmarksColl
        this._listsColl = listsColl
        this._listEntriesColl = listEntriesColl

        this._browserStorageArea = browserStorageArea
        this._getDb = getDb

        this.storageManager.registry.registerCollection(this._annotationsColl, {
            version: new Date(2018, 7, 26),
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
                { field: 'body' },
                { field: 'createdWhen' },
                { field: 'comment' },
            ],
        })

        this.storageManager.registry.registerCollection(this._listEntriesColl, {
            version: new Date(2019, 0, 4),
            fields: {
                listId: { type: 'string' },
                url: { type: 'string' },
                createdAt: { type: 'datetime' },
            },
            indices: [
                { field: ['listId', 'url'], pk: true },
                { field: 'listId' },
                { field: 'url' },
            ],
        })

        this.storageManager.registry.registerCollection(this._bookmarksColl, {
            version: new Date(2019, 0, 5),
            fields: {
                url: { type: 'string' },
                createdAt: { type: 'datetime' },
            },
            indices: [{ field: 'url', pk: true }, { field: 'createdAt' }],
        })

        // NOTE: This is no longer used; keeping to maintain DB schema sanity
        this.storageManager.registry.registerCollection('directLinks', [
            {
                version: new Date(2018, 5, 31),
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
            {
                version: new Date(2018, 7, 3),
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
            },
        ])
    }

    private async getListById({ listId }: { listId: number }) {
        const list = await this.storageManager
            .collection(this._listsColl)
            .findOneObject<{ id: number }>({ id: listId })

        if (list == null) {
            throw new Error(`No list exists for ID: ${listId}`)
        }

        return list.id
    }

    async insertAnnotToList({ listId, url }: AnnotListEntry) {
        await this.getListById({ listId })

        const { object } = await this.storageManager
            .collection(this._listEntriesColl)
            .createObject({ listId, url, createdAt: new Date() })

        return [object.listId, object.url]
    }

    async removeAnnotFromList({ listId, url }: AnnotListEntry) {
        await this.getListById({ listId })

        await this.storageManager
            .collection(this._listEntriesColl)
            .deleteObjects({ listId, url })
    }

    /**
     * @returns Promise resolving to a boolean denoting whether or not a bookmark was created.
     */
    async toggleAnnotBookmark({ url }: { url: string }) {
        const coll = this.storageManager.collection(this._bookmarksColl)

        const bookmark = await coll.findOneObject({ url })

        if (bookmark == null) {
            await coll.createObject({ url, createdAt: new Date() })
            return true
        }

        await coll.deleteOneObject({ url })
        return false
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

        const page = await createPageFromTab(this._getDb)({
            tabId: id,
            url,
            stubOnly: !indexingPrefs.shouldIndexLinks,
        })

        await page.loadRels(this._getDb)

        // Add new visit if none, else page won't appear in results
        // TODO: remove once search changes to incorporate assoc. page data apart from bookmarks/visits
        if (!page.visits.length) {
            page.addVisit()
        }

        await page.save(this._getDb)
    }

    async getAnnotationByPk(url: string) {
        return this.storageManager
            .collection(this._annotationsColl)
            .findOneObject<Annotation>({ url })
    }

    async getAnnotationsByUrl({
        pageUrl,
        limit = 10,
        skip = 0,
    }: {
        pageUrl: string
        limit?: number
        skip?: number
    }) {
        return this.storageManager
            .collection(this._annotationsColl)
            .findObjects<Annotation>({ pageUrl, limit, skip })
    }

    async createAnnotation({
        pageTitle,
        pageUrl,
        body,
        url,
        comment,
        selector,
    }: Annotation) {
        return this.storageManager
            .collection(this._annotationsColl)
            .createObject({
                pageTitle,
                pageUrl,
                comment,
                body,
                selector,
                createdWhen: new Date(),
                lastEdited: {},
                url,
            })
    }

    async editAnnotation(url: string, comment: string) {
        return this.storageManager
            .collection(this._annotationsColl)
            .updateOneObject(
                { url },
                {
                    $set: {
                        comment,
                        lastEdited: new Date(),
                    },
                },
            )
    }

    async deleteAnnotation(url: string) {
        return this.storageManager
            .collection(this._annotationsColl)
            .deleteOneObject({ url })
    }

    async getTagsByAnnotationUrl(url: string) {
        return this.storageManager
            .collection(this._tagsColl)
            .findObjects<Tag>({ url })
    }

    modifyTags = (shouldAdd: boolean) => async (name: string, url: string) => {
        if (shouldAdd) {
            this.storageManager.collection(this._tagsColl).createObject({
                name,
                url,
            })
        } else {
            this.storageManager.collection(this._tagsColl).deleteObjects({
                name,
                url,
            })
        }
    }
}
