import Storex from '@worldbrain/storex'
import { Windows, Tabs } from 'webextension-polyfill-ts'
import TagStorage from './storage'
import { makeRemotelyCallableType } from 'src/util/webextensionRPC'
import { SearchIndex } from 'src/search'
import { pageIsStub, maybeIndexTabs } from 'src/page-indexing/utils'
import PageStorage from 'src/page-indexing/background/storage'
import { TagTab, RemoteTagsInterface } from './types'
import { bindMethod } from 'src/util/functions'
import { initErrHandler } from 'src/search/storage'
import { getOpenTabsInCurrentWindow } from 'src/activity-logger/background/util'
import SearchBackground from 'src/search/background'

export default class TagsBackground {
    storage: TagStorage
    remoteFunctions: RemoteTagsInterface

    _createPageFromTab: SearchIndex['createPageFromTab']

    private windows: Windows.Static
    private searchIndex: SearchIndex

    constructor(
        private options: {
            storageManager: Storex
            pageStorage: PageStorage
            searchIndex: SearchIndex
            queryTabs?: Tabs.Static['query']
            windows?: Windows.Static
            searchBackgroundModule: SearchBackground
        },
    ) {
        this.storage = new TagStorage({
            storageManager: options.storageManager,
        })
        this.remoteFunctions = {
            addTagToExistingUrl: bindMethod(this, 'addTagToExistingUrl'),
            delTag: bindMethod(this, 'delTag'),
            addTagToPage: bindMethod(this, 'addTagToPage'),
            updateTagForPage: bindMethod(this, 'updateTagForPage'),
            fetchPageTags: bindMethod(this, 'fetchPageTags'),
            addTagsToOpenTabs: bindMethod(this, 'addTagsToOpenTabs'),
            delTagsFromOpenTabs: bindMethod(this, 'delTagsFromOpenTabs'),
            searchForTagSuggestions: bindMethod(
                this,
                'searchForTagSuggestions',
            ),
        }
        this.windows = options.windows
        this.searchIndex = options.searchIndex
        this._createPageFromTab = options.searchIndex.createPageFromTab
    }

    setupRemoteFunctions() {
        makeRemotelyCallableType<RemoteTagsInterface>(this.remoteFunctions)
    }

    async searchForTagSuggestions(args: { query: string; limit?: number }) {
        return this.options.searchBackgroundModule.storage.suggest({
            type: 'tag',
            ...args,
        })
    }

    async addTagsToOpenTabs(params: {
        name: string
        tabs?: TagTab[]
        time?: number
    }) {
        const tabs =
            params.tabs ||
            (await getOpenTabsInCurrentWindow(
                this.windows,
                this.options.queryTabs,
            ))

        const indexed = await maybeIndexTabs(tabs, {
            pageStorage: this.options.pageStorage,
            createPage: this._createPageFromTab,
            time: params.time || Date.now(),
        })

        await this.storage.addTags({
            name: params.name,
            urls: indexed.map(tab => tab.fullUrl),
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
            tabs = await getOpenTabsInCurrentWindow(
                this.windows,
                this.options.queryTabs,
            )
        }

        return this.storage.delTags({
            name,
            urls: tabs.map(tab => tab.url),
        })
    }

    async fetchPageTags({ url }: { url: string }) {
        return this.storage.fetchPageTags({ url })
    }

    async addTagToExistingUrl({ tag, url }: { tag: string; url: string }) {
        return this.storage.addTag({ name: tag, url })
    }

    async delTag({ tag, url }: { tag: string; url: string }) {
        return this.storage.delTag({ name: tag, url })
    }

    // Makes sure the page exists first, creating it if it doesn't, before tagging.
    async addTagToPage({
        url,
        tag,
        tabId,
    }: {
        url: string
        tag: string
        tabId?: number
    }) {
        let page = await this.options.pageStorage.getPage(url)

        if (page == null || pageIsStub(page)) {
            page = await this.searchIndex.createPageViaBmTagActs({
                url,
                tabId,
            })
            if (page == null) {
                throw new Error(
                    'Tried to addTagToPage, but could not create the page.',
                )
            }
        }

        // Add new visit if none, else page won't appear in results
        await this.options.pageStorage.addPageVisitIfHasNone(
            page.url,
            Date.now(),
        )
        await this.storage.addTag({ url, name: tag }).catch(initErrHandler())
    }

    // Sugar for the Tag picking UI component
    async updateTagForPage({
        added,
        deleted,
        url,
        tabId,
    }: {
        added: string
        deleted: string
        url: string
        tabId?: number
    }) {
        if (added) {
            await this.addTagToPage({ url, tag: added, tabId })
        }
        if (deleted) {
            await this.delTag({ url, tag: deleted })
        }
    }
}
