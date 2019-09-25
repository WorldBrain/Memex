import Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-storage/lib/pages/constants'

export default class BookmarksStorage extends StorageModule {
    static BMS_COLL = COLLECTION_NAMES.bookmark

    private bookmarksColl: string

    constructor({
        storageManager,
        bookmarksColl = BookmarksStorage.BMS_COLL,
    }: {
        storageManager: Storex
        bookmarksColl?: string
    }) {
        super({ storageManager })
        this.bookmarksColl = bookmarksColl
    }

    getConfig = (): StorageModuleConfig => ({
        collections: {
            [BookmarksStorage.BMS_COLL]:
                COLLECTION_DEFINITIONS[BookmarksStorage.BMS_COLL],
        },
        operations: {
            createBookmark: {
                collection: this.bookmarksColl,
                operation: 'createObject',
            },
            deleteBookmark: {
                collection: this.bookmarksColl,
                operation: 'deleteObjects',
                args: { url: '$url:pk' },
            },
        },
    })

    async addBookmark({
        url,
        time = Date.now(),
    }: {
        url: string
        time?: number
    }) {
        return this.operation('createBookmark', { url, time })
    }

    async delBookmark({ url }: { url: string }) {
        return this.operation('deleteBookmark', { url })
    }
}
