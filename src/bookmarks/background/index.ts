import BookmarksStorage from './storage'
import { StorageManager } from 'src/search/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import normalizeUrl from 'src/util/encode-url-for-id'

export default class BookmarksBackground {
    private storage: BookmarksStorage

    constructor({ storageManager }: { storageManager: StorageManager }) {
        this.storage = new BookmarksStorage({ storageManager })
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            addBookmark: this.addBookmark.bind(this),
            delBookmark: this.delBookmark.bind(this),
        })
    }

    async addBookmark({ url, pageType }: { url: string; pageType: string }) {
        return this.storage.addBookmark({ url: normalizeUrl(url), pageType })
    }

    async delBookmark({ url }: { url: string }) {
        return this.storage.delBookmark({ url: normalizeUrl(url) })
    }
}
