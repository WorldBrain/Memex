import { FeatureStorage } from 'src/search/storage'
import { StorageManager } from 'src/search'

export default class BookmarksStorage extends FeatureStorage {
    static BMS_COLL = 'bookmarks'

    private bookmarksColl: string

    constructor({
        storageManager,
        bookmarksColl = BookmarksStorage.BMS_COLL,
    }: {
        storageManager: StorageManager
        bookmarksColl?: string
    }) {
        super(storageManager)
        this.bookmarksColl = bookmarksColl
    }

    async addBookmark({ url, pageType }: { url: string; pageType?: string }) {
        return this.storageManager
            .collection(this.bookmarksColl)
            .createObject({ url, time: Date.now(), pageType })
    }

    async delBookmark({ url }: { url: string }) {
        return this.storageManager
            .collection(this.bookmarksColl)
            .deleteObjects({ url })
    }
}
