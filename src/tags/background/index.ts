import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { Windows } from 'webextension-polyfill-ts'

import TagStorage from './storage'
import { TabManager } from 'src/activity-logger/background/tab-manager'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { SearchIndex } from 'src/search'
import { pageIsStub } from 'src/page-indexing/utils'
import PageStorage from 'src/page-indexing/background/storage'

interface Tab {
    tabId: number
    url: string
}

export default class TagsBackground {
    storage: TagStorage

    _createPageFromTab: SearchIndex['createPageFromTab']

    private tabMan: TabManager
    private windows: Windows.Static
    private searchIndex: SearchIndex

    constructor(
        private options: {
            storageManager: Storex
            pageStorage: PageStorage
            searchIndex: SearchIndex
            tabMan?: TabManager
            windows?: Windows.Static
        },
    ) {
        this.storage = new TagStorage({
            storageManager: options.storageManager,
        })
        this.tabMan = options.tabMan
        this.windows = options.windows
        this.searchIndex = options.searchIndex
        this._createPageFromTab = options.searchIndex.createPageFromTab
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            addTag: this.addTag.bind(this),
            delTag: this.delTag.bind(this),
            addTagsToOpenTabs: this.addTagsToOpenTabs.bind(this),
            delTagsFromOpenTabs: this.delTagsFromOpenTabs.bind(this),
        })
    }

    async addTagsToOpenTabs({
        tag,
        tabs,
        time,
    }: {
        tag: string
        tabs?: Tab[]
        time?: number
    }) {
        if (!tabs) {
            const currentWindow = await this.windows.getCurrent()
            tabs = this.tabMan.getTabUrls(currentWindow.id)
        }

        time = time || Date.now()

        await Promise.all(
            tabs.map(async tab => {
                let page = await this.searchIndex.getPage(tab.url)

                if (!page || pageIsStub(page)) {
                    page = await this._createPageFromTab({
                        tabId: tab.tabId,
                        url: tab.url,
                        allowScreenshot: false,
                    })
                }

                // Add new visit if none, else page won't appear in results
                await this.options.pageStorage.addPageVisitIfHasNone(
                    page.url,
                    time,
                )
            }),
        )

        return this.storage.addTagsToOpenTabs({
            name: tag,
            urls: tabs.map(tab => normalizeUrl(tab.url)),
        })
    }

    async delTagsFromOpenTabs({ name, tabs }: { name: string; tabs?: Tab[] }) {
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
