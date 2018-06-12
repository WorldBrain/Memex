import { browser, Tabs } from 'webextension-polyfill-ts'

import {
    FeatureStorage,
    createPageFromTab,
} from '../../search/search-index-new'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../../options/settings/constants'

export default class DirectLinkingStorage extends FeatureStorage {
    constructor(storageManager) {
        super(storageManager)

        this.storageManager.registerCollection('directLinks', {
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
        })
    }

    async insertDirectLink({ pageTitle, pageUrl, url, body, selector }) {
        await this.storageManager.putObject('directLinks', {
            pageTitle,
            pageUrl,
            body,
            selector,
            createdWhen: new Date(),
            url,
        })
    }

    async indexPageFromTab({ id, url }: Tabs.Tab) {
        const {
            [IDXING_PREF_KEYS.LINKS]: fullyIndexLinks,
        } = await browser.storage.local.get(IDXING_PREF_KEYS.LINKS)

        const page = await createPageFromTab({
            tabId: id,
            url,
            stubOnly: !fullyIndexLinks,
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
