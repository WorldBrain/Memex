import Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-storage/lib/pages/constants'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

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
            findBookmarkByUrl: {
                collection: this.bookmarksColl,
                operation: 'findObject',
                args: { url: '$url:string' },
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
        const normalizedUrl = normalizeUrl(url, {})
        return this.operation('createBookmark', { url: normalizedUrl, time })
    }

    async delBookmark({ url }: { url: string }) {
        const normalizedUrl = normalizeUrl(url, {})
        return this.operation('deleteBookmark', { url: normalizedUrl })
    }

    async createBookmarkIfNeeded(url: string, time: number) {
        if (!(await this.pageHasBookmark(url))) {
            await this.addBookmark({ url, time })
        }
    }

    async pageHasBookmark(url: string): Promise<boolean> {
        const normalizedUrl = normalizeUrl(url, {})
        return !!(await this.operation('findBookmarkByUrl', {
            url: normalizedUrl,
        }))
    }
}
