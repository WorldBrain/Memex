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
import { Bookmark } from '@worldbrain/memex-storage/lib/mobile-app/features/overview/types'

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
            findTabBookmarks: {
                collection: this.bookmarksColl,
                operation: 'findObjects',
                args: { url: { $in: '$normalizedPageUrls' } },
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
        return this.operation('createBookmark', { url: url, time })
    }

    async delBookmark({ url }: { url: string }) {
        return this.operation('deleteBookmark', { url })
    }

    async createBookmarkIfNeeded(url: string, time: number) {
        if (!(await this.pageHasBookmark(url))) {
            await this.addBookmark({ url, time })
        }
    }

    pageHasBookmark = async (url: string): Promise<boolean> => {
        return !!(await this.operation('findBookmarkByUrl', {
            url,
        }))
    }

    async findTabBookmarks(normalizedPageUrls: string[]): Promise<Bookmark[]> {
        return this.operation('findTabBookmarks', { normalizedPageUrls })
    }
}
