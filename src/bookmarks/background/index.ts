import { Tabs, Browser, Bookmarks } from 'webextension-polyfill-ts'
import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { TabManager } from 'src/tab-management/background/tab-manager'
import BookmarksStorage from './storage'
import { BookmarksInterface } from './types'
import Raven from 'raven-js'
import { PageIndexingBackground } from 'src/page-indexing/background'
import pick from 'lodash/pick'
import { pageIsStub } from 'src/page-indexing/utils'

export default class BookmarksBackground {
    storage: BookmarksStorage
    remoteFunctions: BookmarksInterface

    constructor(
        private options: {
            storageManager: Storex
            pages: PageIndexingBackground
            browserAPIs: Pick<Browser, 'bookmarks'>
            tabManager: TabManager
        },
    ) {
        this.storage = new BookmarksStorage(pick(options, 'storageManager'))
        this.addBookmark = this.addBookmark.bind(this)
        this.delBookmark = this.delBookmark.bind(this)

        this.remoteFunctions = {
            addPageBookmark: this.addPageBookmark,
            delPageBookmark: this.delPageBookmark,
            pageHasBookmark: this.storage.pageHasBookmark,
        }
    }

    setupBookmarkListeners() {
        // Handle any new browser bookmark actions (bookmark mananger or bookmark btn in URL bar)
        this.options.browserAPIs.bookmarks.onCreated.addListener(
            this.handleBookmarkCreation.bind(this),
        )
        this.options.browserAPIs.bookmarks.onRemoved.addListener(
            this.handleBookmarkRemoval.bind(this),
        )
    }

    addPageBookmark = async (params: {
        url: string
        timestamp?: number
        tabId?: number
    }) => {
        let page = await this.options.pages.storage.getPage(params.url)

        if (page == null || pageIsStub(page)) {
            page = await this.options.pages.createPageViaBmTagActs({
                fullUrl: params.url,
                tabId: params.tabId,
            })
        }

        await this.storage.createBookmarkIfNeeded(page.url, params.timestamp)
        // this.options.tabManager.setBookmarkState(params.url, true)
    }

    delPageBookmark = async ({ url }: Partial<Bookmarks.BookmarkTreeNode>) => {
        await this.storage.delBookmark({ url })
        await this.options.pages.storage.deletePageIfOrphaned(url)
        // this.options.tabManager.setBookmarkState(url, false)
    }

    async addBookmark({ url, time }: { url: string; time?: number }) {
        return this.storage.addBookmark({ url: normalizeUrl(url), time })
    }

    async delBookmark({ url }: { url: string }) {
        return this.storage.delBookmark({ url: normalizeUrl(url) })
    }

    async findTabBookmarks(tabs: Tabs.Tab[]): Promise<Map<string, boolean>> {
        const normalizedUrlsMap = new Map<string, string>()
        for (const tab of tabs) {
            normalizedUrlsMap.set(tab.url, normalizeUrl(tab.url))
        }

        const foundBookmarks = await this.storage.findTabBookmarks([
            ...normalizedUrlsMap.values(),
        ])

        const foundBookmarksSet = new Set<string>()
        for (const { url: normalizedUrl } of foundBookmarks) {
            foundBookmarksSet.add(normalizedUrl)
        }

        const bookmarkMap = new Map()
        for (const tab of tabs) {
            const normalizedUrl = normalizedUrlsMap.get(tab.url)
            bookmarkMap.set(tab.url, foundBookmarksSet.has(normalizedUrl))
        }

        return bookmarkMap
    }

    async handleBookmarkRemoval(
        id: string,
        { node }: { node: Bookmarks.BookmarkTreeNode },
    ) {
        // Created folders won't have `url`; ignore these
        if (!node.url) {
            return
        }

        try {
            await this.delPageBookmark(node)
        } catch (err) {
            Raven.captureException(err)
        }
    }

    async handleBookmarkCreation(id: string, node: Bookmarks.BookmarkTreeNode) {
        // Created folders won't have `url`; ignore these
        if (!node.url) {
            return
        }

        let tabId
        const activeTab = this.options.tabManager.getActiveTab()

        if (activeTab != null && activeTab.url === node.url) {
            tabId = activeTab.id
        }

        return this.addPageBookmark({ url: node.url, tabId })
    }
}
