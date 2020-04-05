import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'

import { STORAGE_VERSIONS } from 'src/storage/constants'
import { BacklogEntry, BacklogEntryCreateArgs } from './types'

export class PageFetchBacklogStorage extends StorageModule {
    static BACKLOG_COLL = 'pageFetchBacklog'

    getConfig = (): StorageModuleConfig => ({
        collections: {
            [PageFetchBacklogStorage.BACKLOG_COLL]: {
                version: STORAGE_VERSIONS[18].version,
                fields: {
                    url: { type: 'string' },
                    createdAt: { type: 'datetime' },
                    timesRetried: { type: 'int' },
                    lastRetry: { type: 'datetime' },
                },
                indices: [{ field: 'createdAt' }],
                watch: false,
                backup: false,
            },
        },
        operations: {
            createEntry: {
                collection: PageFetchBacklogStorage.BACKLOG_COLL,
                operation: 'createObject',
            },
            findOldestEntry: {
                collection: PageFetchBacklogStorage.BACKLOG_COLL,
                operation: 'findObject',
                args: {},
            },
            findOldestEntries: {
                collection: PageFetchBacklogStorage.BACKLOG_COLL,
                operation: 'findObjects',
                args: [{}, { limit: '$limit:int' }],
            },
            deleteEntry: {
                collection: PageFetchBacklogStorage.BACKLOG_COLL,
                operation: 'deleteObject',
                args: { id: '$id:pk' },
            },
            deleteEntries: {
                collection: PageFetchBacklogStorage.BACKLOG_COLL,
                operation: 'deleteObjects',
                args: { id: { $in: '$ids:pk' } },
            },
        },
    })

    async createEntry({
        url,
        timesRetried = 0,
        lastRetry = new Date(),
        createdAt = new Date(),
    }: BacklogEntryCreateArgs): Promise<void> {
        await this.operation('createEntry', {
            url,
            timesRetried,
            lastRetry,
            createdAt,
        })
    }

    async removeOldestEntry(): Promise<BacklogEntry | null> {
        const result = await this.operation('findOldestEntry', {})

        if (result == null) {
            return null
        }

        await this.operation('deleteEntry', { id: result.id })

        return {
            url: result.url,
            timesRetried: result.timesRetried,
            lastRetry: result.lastRetry,
        }
    }

    async removeOldestEntries(limit: number): Promise<BacklogEntry[] | null> {
        const result = await this.operation('findOldestEntries', { limit })

        if (result == null || !result.length) {
            return null
        }

        await this.operation('deleteEntries', {
            ids: result.map(entry => entry.id),
        })

        return result.map(entry => ({
            url: entry.url,
            timesRetried: entry.timesRetried,
            lastRetry: entry.lastRetry,
        }))
    }
}
