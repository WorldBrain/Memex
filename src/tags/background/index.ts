import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { Windows } from 'webextension-polyfill-ts'

import TagStorage from './storage'
import { TabManager } from 'src/activity-logger/background/tab-manager'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { SearchIndex } from 'src/search'
import { pageIsStub } from 'src/page-indexing/utils'

interface Tabs {
    tabId: number
    url: string
}

export default class TagsBackground {
    storage: TagStorage
    private tabMan: TabManager
    private windows: Windows.Static
    private searchIndex: SearchIndex

    constructor({
        storageManager,
        searchIndex,
        tabMan,
        windows,
    }: {
        storageManager: Storex
        searchIndex: SearchIndex
        tabMan?: TabManager
        windows?: Windows.Static
    }) {
        this.storage = new TagStorage({ storageManager })
        this.tabMan = tabMan
        this.windows = windows
        this.searchIndex = searchIndex
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            addTag: this.addTag.bind(this),
            delTag: this.delTag.bind(this),
            addTagsToOpenTabs: this.addTagsToOpenTabs.bind(this),
            delTagsFromOpenTabs: this.delTagsFromOpenTabs.bind(this),
        })
    }

    async addTagsToOpenTabs({ tag, tabs }: { tag: string; tabs?: Tabs[] }) {
        if (!tabs) {
            const currentWindow = await this.windows.getCurrent()
            tabs = this.tabMan.getTabUrls(currentWindow.id)
        }

        const time = Date.now()

        tabs.forEach(async tab => {
            let page = await this.searchIndex.getPage(tab.url)

            if (!page == null || pageIsStub(page)) {
                page = await this.searchIndex.createPageFromTab({
                    tabId: tab.tabId,
                    url: tab.url,
                    allowScreenshot: false,
                })
            }

            // Add new visit if none, else page won't appear in results
            if (!page.visits.length) {
                page.addVisit(time)
            }

            await page.save()
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

    async addTag({ tag, url }: { tag: string; url: string }) {
        return this.storage.addTag({ name: tag, url: normalizeUrl(url) })
    }

    async delTag({ tag, url }: { tag: string; url: string }) {
        return this.storage.delTag({ name: tag, url: normalizeUrl(url) })
    }
}
