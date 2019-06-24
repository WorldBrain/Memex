import Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'

export default class BookmarksStorage extends StorageModule {
    static BMS_COLL = 'bookmarks'

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
            [this.bookmarksColl]: {
                version: new Date(2018, 1, 1),
                fields: {
                    url: { type: 'string' },
                    time: { type: 'timestamp' },
                },
                indices: [{ field: 'url', pk: true }, { field: 'time' }],
            },
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

    async addBookmark({ url }: { url: string }) {
        return this.operation('createBookmark', {
            url,
            time: Date.now(),
        })
    }

    async delBookmark({ url }: { url: string }) {
        return this.operation('deleteBookmark', { url })
    }
}
