import StorageManager from 'storex'
import { browser, Tabs, Storage } from 'webextension-polyfill-ts'

import { createPageFromTab, Tag } from '../../search'
import { FeatureStorage } from '../../search/storage'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../../options/settings/constants'

export interface Annotation {
    pageTitle: string
    pageUrl: string
    body: string
    selector: object
    createdWhen?: Date
    lastEdited?: Date
    url?: string
    comment?: string
}

export default class DirectLinkingStorage extends FeatureStorage {
    static DIRECT_LINKS_COLL = 'directLinks'

    private _browserStorageArea: Storage.StorageArea

    constructor({
        storageManager,
        browserStorageArea = browser.storage.local,
    }: {
        storageManager: StorageManager
        browserStorageArea: Storage.StorageArea
    }) {
        super(storageManager)
        this._browserStorageArea = browserStorageArea

        this.storageManager.registry.registerCollection(
            DirectLinkingStorage.DIRECT_LINKS_COLL,
            [
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
            ],
        )
    }

    private async fetchIndexingPrefs(): Promise<{ shouldIndexLinks: boolean }> {
        const storage = await this._browserStorageArea.get(
            IDXING_PREF_KEYS.LINKS,
        )

        return {
            shouldIndexLinks: !!storage[IDXING_PREF_KEYS.LINKS],
        }
    }

    async insertDirectLink({
        pageTitle,
        pageUrl,
        url,
        body,
        selector,
    }: Annotation) {
        await this.storageManager
            .collection(DirectLinkingStorage.DIRECT_LINKS_COLL)
            .createObject({
                pageTitle,
                pageUrl,
                body,
                selector,
                createdWhen: new Date(),
                lastEdited: {},
                url,
                comment: '',
            })
    }

    async indexPageFromTab({ id, url }: Tabs.Tab) {
        const indexingPrefs = await this.fetchIndexingPrefs()

        const page = await createPageFromTab({
            tabId: id,
            url,
            stubOnly: !indexingPrefs.shouldIndexLinks,
        })

        await page.loadRels()

        // Add new visit if none, else page won't appear in results
        // TODO: remove once search changes to incorporate assoc. page data apart from bookmarks/visits
        if (!page.visits.length) {
            page.addVisit()
        }

        await page.save()
    }
}

// TODO: Move to src/annotations in the future
export class AnnotationStorage extends FeatureStorage {
    static ANNOTATIONS_COLL = 'annotations'
    static TAGS_COLL = 'tags'

    private _browserStorageArea: Storage.StorageArea

    constructor({
        storageManager,
        browserStorageArea = browser.storage.local,
    }: {
        storageManager: StorageManager
        browserStorageArea: Storage.StorageArea
    }) {
        super(storageManager)
        this._browserStorageArea = browserStorageArea

        this.storageManager.registry.registerCollection(
            AnnotationStorage.ANNOTATIONS_COLL,
            {
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
            },
        )
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

        const page = await createPageFromTab({
            tabId: id,
            url,
            stubOnly: !indexingPrefs.shouldIndexLinks,
        })

        await page.loadRels()

        // Add new visit if none, else page won't appear in results
        // TODO: remove once search changes to incorporate assoc. page data apart from bookmarks/visits
        if (!page.visits.length) {
            page.addVisit()
        }

        await page.save()
    }

    async getAnnotationByPk(url: string) {
        return this.storageManager
            .collection(AnnotationStorage.ANNOTATIONS_COLL)
            .findOneObject({ url })
    }

    async getAnnotationsByUrl(pageUrl: string) {
        return this.storageManager
            .collection(AnnotationStorage.ANNOTATIONS_COLL)
            .findObjects({ pageUrl })
    }

    async insertDirectLink({
        pageTitle,
        pageUrl,
        url,
        body,
        selector,
    }: Annotation) {
        await this.storageManager
            .collection(AnnotationStorage.ANNOTATIONS_COLL)
            .createObject({
                pageTitle,
                pageUrl,
                body,
                selector,
                createdWhen: new Date(),
                lastEdited: {},
                url,
                comment: '',
            })
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
            .collection(AnnotationStorage.ANNOTATIONS_COLL)
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
            .collection(AnnotationStorage.ANNOTATIONS_COLL)
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
            .collection(AnnotationStorage.ANNOTATIONS_COLL)
            .deleteOneObject({ url })
    }

    async getTagsByAnnotationUrl(url: string) {
        return this.storageManager
            .collection(AnnotationStorage.ANNOTATIONS_COLL)
            .findObjects({ url })
    }

    modifyTags = (shouldAdd: boolean) => async (name: string, url: string) => {
        if (shouldAdd) {
            this.storageManager
                .collection(AnnotationStorage.TAGS_COLL)
                .createObject({
                    name,
                    url,
                })
        } else {
            this.storageManager
                .collection(AnnotationStorage.TAGS_COLL)
                .deleteOneObject({
                    name,
                    url,
                })
        }
    }
}
