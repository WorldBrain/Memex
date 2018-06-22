import { browser, Tabs, Storage } from 'webextension-polyfill-ts'

import { createPageFromTab } from '../../search/search-index-new'
import {
    FeatureStorage,
    ManageableStorage,
} from '../../search/search-index-new/storage'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../../options/settings/constants'

export const COLLECTION_NAME = 'directLinks'

export default class DirectLinkingStorage extends FeatureStorage {
    private _browserStorageArea: Storage.StorageArea

    constructor({
        storageManager,
        browserStorageArea = browser.storage.local,
    }: {
        storageManager: ManageableStorage
        browserStorageArea: Storage.StorageArea
    }) {
        super(storageManager)

        this._browserStorageArea = browserStorageArea

        this.storageManager.registerCollection(COLLECTION_NAME, {
            version: new Date(2018, 6, 27),
            fields: {
                pageTitle: { type: 'text' },
                pageUrl: { type: 'url' },
                body: { type: 'text' },
                comment: { type: 'text' },
                selector: { type: 'json' },
                createdWhen: { type: 'datetime' },
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
    }

    private async fetchIndexingPrefs(): Promise<{ shouldIndexLinks: boolean }> {
        const storage = await this._browserStorageArea.get(
            IDXING_PREF_KEYS.LINKS,
        )

        return {
            shouldIndexLinks: !!storage[IDXING_PREF_KEYS.LINKS],
        }
    }

    async insertDirectLink({ pageTitle, pageUrl, url, body, selector }) {
        await this.storageManager.putObject(COLLECTION_NAME, {
            pageTitle,
            pageUrl,
            body,
            selector,
            createdWhen: new Date(),
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

    async getAnnotationsByUrl(pageUrl: string) {
        return await this.storageManager.findAll(COLLECTION_NAME, {
            pageUrl,
        })
    }

    async createComment({ pageTitle, pageUrl, comment }) {
        const uniqueUrl: string = `${pageUrl}/#${new Date().getTime()}`
        return await this.storageManager.putObject(COLLECTION_NAME, {
            pageTitle,
            pageUrl,
            comment,
            createdWhen: new Date(),
            body: '',
            selector: {},
            url: uniqueUrl,
        })
    }
}
