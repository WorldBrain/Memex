import { Tabs, Browser, Bookmarks } from 'webextension-polyfill'
import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { isFullUrl } from '@worldbrain/memex-common/lib/url-utils/normalize/utils'

import BookmarksStorage from './storage'
import { BookmarksInterface } from './types'
import Raven from 'raven-js'
import { PageIndexingBackground } from 'src/page-indexing/background'
import pick from 'lodash/pick'
import { Analytics } from 'src/analytics/types'
import checkBrowser from '../../util/check-browser'
import browser from 'webextension-polyfill'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import {
    trackAnnotationCreate,
    trackBookmarkCreate,
} from '@worldbrain/memex-common/lib/analytics/events'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'

const BOOKMARK_SYNC_STORAGE_NAME = 'memex:settings:bookmarkSync'

export default class BookmarksBackground {
    storage: BookmarksStorage
    remoteFunctions: BookmarksInterface

    constructor(
        private options: {
            storageManager: Storex
            pages: PageIndexingBackground
            browserAPIs: Pick<Browser, 'bookmarks' | 'tabs' | 'storage'>
            analytics: Analytics
            analyticsBG: AnalyticsCoreInterface
        },
    ) {
        this.storage = new BookmarksStorage(pick(options, 'storageManager'))
        this.addBookmark = this.addBookmark.bind(this)
        this.delBookmark = this.delBookmark.bind(this)

        this.remoteFunctions = {
            addPageBookmark: this.addPageBookmark,
            delPageBookmark: this.delPageBookmark,
            findBookmark: this.storage.findBookmark,
            pageHasBookmark: this.storage.pageHasBookmark,
            setBookmarkStatusInBrowserIcon: this.setBookmarkStatusInBrowserIcon,
            autoSetBookmarkStatusInBrowserIcon: this
                .autoSetBookmarkStatusInBrowserIcon,
        }
    }
    get ROOT_BM() {
        return {
            id: checkBrowser() === 'firefox' ? '' : '0',
        }
    }

    async setupBookmarkListeners() {
        const shouldSetup = await getLocalStorage(BOOKMARK_SYNC_STORAGE_NAME)

        if (shouldSetup) {
            // Handle any new browser bookmark actions (bookmark mananger or bookmark btn in URL bar)
            this.options.browserAPIs.bookmarks.onCreated.addListener(
                this.handleBookmarkCreation.bind(this),
            )
            this.options.browserAPIs.bookmarks.onRemoved.addListener(
                this.handleBookmarkRemoval.bind(this),
            )
        }

        this.options.browserAPIs.storage.onChanged.addListener(
            (changes, area) => {
                if (changes[BOOKMARK_SYNC_STORAGE_NAME] != null) {
                    if (changes[BOOKMARK_SYNC_STORAGE_NAME].newValue === true) {
                        this.options.browserAPIs.bookmarks.onCreated.addListener(
                            this.handleBookmarkCreation.bind(this),
                        )
                    } else {
                        this.options.browserAPIs.bookmarks.onCreated.removeListener(
                            this.handleBookmarkCreation.bind(this),
                        )
                    }
                }
            },
        )
    }

    addPageBookmark = async (params: {
        url?: string
        fullUrl: string
        timestamp?: number
        tabId?: number
        skipIndexing?: boolean
        metaData?: {
            pageTitle?: string
        }
    }) => {
        const fullUrl = params.fullUrl ?? params.url
        if (!isFullUrl(fullUrl)) {
            console.error('Invalid Bookmark', { params })
            throw new Error(
                'Tried to create a bookmark with a normalized, instead of a full URL',
            )
        }

        let tabId = params.tabId
        if (tabId == null) {
            const [activeTab] = await this.options.browserAPIs.tabs.query({
                currentWindow: true,
                active: true,
            })
            tabId = activeTab.id
        }

        if (!params.skipIndexing) {
            await this.options.pages.indexPage(
                {
                    tabId,
                    fullUrl,
                    visitTime: params.timestamp || '$now',
                    metaData: params.metaData,
                },
                { addInboxEntryOnCreate: true },
            )
        }

        await this.storage.createBookmarkIfNeeded(fullUrl, params.timestamp)

        await trackBookmarkCreate(this.options.analyticsBG)
    }

    delPageBookmark = async ({ url }: { url: string }) => {
        await this.storage.delBookmark({ url })
        await this.options.pages.storage.deletePageIfOrphaned(url)
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
        const shouldSave = await getLocalStorage(BOOKMARK_SYNC_STORAGE_NAME)
        // Created folders won't have `url`; ignore these
        if (!node.url || !shouldSave) {
            return
        }

        let tabId: number
        const [activeTab] = await this.options.browserAPIs.tabs.query({
            currentWindow: true,
            active: true,
        })

        if (activeTab != null && activeTab.url === node.url) {
            tabId = activeTab.id
        }
        return this.addPageBookmark({
            fullUrl: node.url,
            tabId,
        })
    }

    private async setBookmarkStatus(isSet: boolean, tabId: number) {
        if (isSet) {
            await browser.action.setBadgeText({ text: '❤️', tabId })
            await browser.action.setBadgeBackgroundColor({
                color: 'white',
            })
        } else {
            await browser.action.setBadgeText({ text: '', tabId })
        }
    }

    autoSetBookmarkStatusInBrowserIcon: BookmarksInterface['autoSetBookmarkStatusInBrowserIcon'] = async (
        tabId,
    ) => {
        const tab = await this.options.browserAPIs.tabs.get(tabId)
        if (tab?.url == null) {
            return
        }

        const pageHasBookmark = await this.storage.pageHasBookmark(tab.url)
        // await this.setBookmarkStatus(pageHasBookmark, tabId)
    }

    setBookmarkStatusInBrowserIcon: BookmarksInterface['setBookmarkStatusInBrowserIcon'] = async (
        value,
        pageUrl,
    ) => {
        const [activeTab] = await this.options.browserAPIs.tabs.query({
            currentWindow: true,
            active: true,
        })

        if (activeTab?.url !== pageUrl) {
            return
        }

        await this.setBookmarkStatus(value, activeTab.id)
    }
}
