import { Tabs } from 'webextension-polyfill-ts'
import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import BookmarksStorage from './storage'

export default class BookmarksBackground {
    storage: BookmarksStorage

    constructor({ storageManager }: { storageManager: Storex }) {
        this.storage = new BookmarksStorage({ storageManager })
        this.addBookmark = this.addBookmark.bind(this)
        this.delBookmark = this.delBookmark.bind(this)
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
}
