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
}
