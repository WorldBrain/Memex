import TagStorage from './storage'
import { TabManager } from 'src/activity-logger/background/tab-manager'
import { Dexie, StorageManager } from 'src/search/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import normalizeUrl from 'src/util/encode-url-for-id'
import { Windows } from 'webextension-polyfill-ts'
import { getPage } from 'src/search/util'
import { createPageFromTab } from 'src/search'

interface Tabs {
    tabId: number
    url: string
}

export default class TagsBackground {
    private storage: TagStorage
    private getDb: () => Promise<Dexie>
    private tabMan: TabManager
    private windows: Windows.Static

    constructor({
        storageManager,
        getDb,
        tabMan,
        windows,
    }: {
        storageManager: StorageManager
        getDb: () => Promise<Dexie>
        tabMan?: TabManager
        windows?: Windows.Static
    }) {
        this.storage = new TagStorage({ storageManager })
        this.getDb = getDb
        this.tabMan = tabMan
        this.windows = windows
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            addTagsToOpenTabs: this.addTagsToOpenTabs.bind(this),
            delTagsFromOpenTabs: this.delTagsFromOpenTabs.bind(this),
        })
    }

    async addTagsToOpenTabs({ name, tabs }: { name: string; tabs?: Tabs[] }) {
        if (!tabs) {
            const currentWindow = await this.windows.getCurrent()
            tabs = this.tabMan.getTabUrls(currentWindow.id)
        }

        const time = Date.now()

        tabs.forEach(async tab => {
            let page = await getPage(this.getDb)(tab.url)

            if (page == null || page.isStub) {
                page = await createPageFromTab(this.getDb)({
                    tabId: tab.tabId,
                    url: tab.url,
                    allowScreenshot: false,
                })
            }

            // Add new visit if none, else page won't appear in results
            if (!page.visits.length) {
                page.addVisit(time)
            }

            await page.save(this.getDb)
        })

        return this.storage.addTagsToOpenTabs({
            name,
            urls: tabs.map(tab => normalizeUrl(tab.url)),
        })
    }

    async delTagsFromOpenTabs({ name, tabs }: { name: string; tabs?: Tabs[] }) {
        if (!tabs) {
            const currentWindow = await this.windows.getCurrent()
            tabs = this.tabMan.getTabUrls(currentWindow.id)
        }

        return this.storage.delTagsFromOpenTabs({
            name,
            urls: tabs.map(tab => normalizeUrl(tab.url)),
        })
    }

    async fetchPageTags({ url }: { url: string }) {
        return this.storage.fetchPageTags({ url: normalizeUrl(url) })
    }

    async addTag({ name, url }: { name: string; url: string }) {
        return this.storage.addTag({ name, url: normalizeUrl(url) })
    }

    async delTag({ name, url }: { name: string; url: string }) {
        return this.storage.delTag({ name, url: normalizeUrl(url) })
    }

    async fetchPages({ name }: { name: string }) {
        return this.storage.fetchPages({ name })
    }
}
