import { Tabs, Browser, Bookmarks } from 'webextension-polyfill-ts'
import Storex from '@worldbrain/storex'
import { normalizeUrl, isFullUrl } from '@worldbrain/memex-url-utils'
import { TabManager } from 'src/tab-management/background/tab-manager'
import BookmarksStorage from './storage'
import { BookmarksInterface } from './types'
import Raven from 'raven-js'
import { PageIndexingBackground } from 'src/page-indexing/background'
import pick from 'lodash/pick'
import { pageIsStub } from 'src/page-indexing/utils'
import { Analytics } from 'src/analytics/types'
import checkBrowser from '../../util/check-browser'

export default class BookmarksBackground {
    storage: BookmarksStorage
    remoteFunctions: BookmarksInterface

    constructor(
        private options: {
            storageManager: Storex
            pages: PageIndexingBackground
            browserAPIs: Pick<Browser, 'bookmarks'>
            tabManager: TabManager
            analytics: Analytics
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
    get ROOT_BM() {
        return {
            id: checkBrowser() === 'firefox' ? '' : '0',
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
        url?: string
        fullUrl: string
        timestamp?: number
        tabId?: number
        skipIndexing?: boolean
    }) => {
        const fullUrl = params.fullUrl ?? params.url
        if (!isFullUrl(fullUrl)) {
            console.error('Invalid Bookmark', { params })
            throw new Error(
                'Tried to create a bookmark with a normalized, instead of a full URL',
            )
        }

        if (!params.skipIndexing) {
            await this.options.pages.indexPage(
                {
                    fullUrl,
                    tabId: params.tabId,
                    visitTime: params.timestamp || '$now',
                },
                { addInboxEntryOnCreate: true },
            )
        }

        await this.storage.createBookmarkIfNeeded(fullUrl, params.timestamp)

        this.options.analytics.trackEvent({
            category: 'Bookmarks',
            action: 'createBookmarkForPage',
        })
        // this.options.tabManager.setBookmarkState(params.url, true)
    }

    delPageBookmark = async ({ url }: { url: string }) => {
        await this.storage.delBookmark({ url })
        await this.options.pages.storage.deletePageIfOrphaned(url)
        // this.options.tabManager.setBookmarkState(url, false)
    }

    addBookmark = this.addPageBookmark
    delBookmark = this.delPageBookmark

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
            await this.delPageBookmark({ url: node.url })
        } catch (err) {
            Raven.captureException(err)
        }
    }

    async getBookmarkCollectionName(parentId: string) {
        // call browser.bookmark.get(id) with parent id until we get to the root which has id "0"
        // format collection name as "dir1 > ... > dirN"
        // Unused for now but will be useful in the future
        let collectionName = ''
        let currentId = parentId
        while (currentId !== this.ROOT_BM.id) {
            const dir = (
                await this.options.browserAPIs.bookmarks.get(currentId)
            )[0]
            collectionName =
                collectionName === ''
                    ? dir.title
                    : dir.title + ' > ' + collectionName
            currentId = dir.parentId
        }
        return collectionName
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
        return this.addPageBookmark({
            fullUrl: node.url,
            tabId,
        })
    }
}
