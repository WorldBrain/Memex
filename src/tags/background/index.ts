import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { Windows } from 'webextension-polyfill-ts'

import TagStorage from './storage'
import { TabManager } from 'src/activity-logger/background/tab-manager'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { SearchIndex } from 'src/search'
import { pageIsStub } from 'src/page-indexing/utils'
import PageStorage from 'src/page-indexing/background/storage'
import { TagTab, RemoteTagsInterface } from './types'
import { bindMethod } from 'src/util/functions'
import { initErrHandler } from 'src/search/storage'

export default class TagsBackground {
    storage: TagStorage
    remoteFunctions: RemoteTagsInterface

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
        this.remoteFunctions = {
            addTag: bindMethod(this, 'addTag'),
            delTag: bindMethod(this, 'delTag'),
            addPageTag: params => {
                return this._modifyTag(true, params)
            },
            delPageTag: params => {
                return this._modifyTag(false, params)
            },
            fetchPageTags: async (url: string) => {
                return this.storage.fetchPageTags({ url })
            },

            addTagsToOpenTabs: bindMethod(this, 'addTagsToOpenTabs'),
            delTagsFromOpenTabs: bindMethod(this, 'delTagsFromOpenTabs'),
        }
        this.tabMan = options.tabMan
        this.windows = options.windows
        this.searchIndex = options.searchIndex
        this._createPageFromTab = options.searchIndex.createPageFromTab
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    async addTagsToOpenTabs({
        tag,
        tabs,
        time,
    }: {
        tag: string
        tabs?: TagTab[]
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

        return this.storage.addTagToPages({
            name: tag,
            urls: tabs.map(tab => tab.url),
        })
    }

    async delTagsFromOpenTabs({
        name,
        tabs,
    }: {
        name: string
        tabs?: TagTab[]
    }) {
        if (!tabs) {
            const currentWindow = await this.windows.getCurrent()
            tabs = this.tabMan.getTabUrls(currentWindow.id)
        }

        return this.storage.delTagsFromPages({
            name,
            urls: tabs.map(tab => tab.url),
        })
    }

    async fetchPageTags({ url }: { url: string }) {
        return this.storage.fetchPageTags({ url })
    }

    async addTag({ tag, url }: { tag: string; url: string }) {
        return this.storage.addTag({ name: tag, url })
    }

    async delTag({ tag, url }: { tag: string; url: string }) {
        console.log('delTag', tag, url)
        return this.storage.delTag({ name: tag, url })
    }

    async _modifyTag(
        shouldAdd: boolean,
        params: {
            url: string
            tag: string
            tabId?: number
        },
    ) {
        const pageStorage = this.options.pageStorage

        if (shouldAdd) {
            let page = await pageStorage.getPage(params.url)

            if (page == null || pageIsStub(page)) {
                page = await this.searchIndex.createPageViaBmTagActs({
                    url: params.url,
                    tabId: params.tabId,
                })
            }

            // Add new visit if none, else page won't appear in results
            await pageStorage.addPageVisitIfHasNone(page.url, Date.now())
        }

        if (shouldAdd) {
            await this.storage
                .addTag({ url: params.url, name: params.tag })
                .catch(initErrHandler())
        } else {
            await this.storage
                .delTag({ url: params.url, name: params.tag })
                .catch(initErrHandler())
        }
    }
}
