import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'

import { BacklogEntry, BacklogEntryCreateArgs } from './types'

export class PageFetchBacklogStorage extends StorageModule {
    static BACKLOG_COLL = 'pageFetchBacklog'

    getConfig = (): StorageModuleConfig => ({
        collections: {
            [PageFetchBacklogStorage.BACKLOG_COLL]: {
                version: new Date('2019-11-07'),
                fields: {
                    url: { type: 'string' },
                    createdAt: { type: 'datetime' },
                    timesRetried: { type: 'int' },
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
            deleteEntry: {
                collection: PageFetchBacklogStorage.BACKLOG_COLL,
                operation: 'deleteObject',
                args: { id: '$id:pk' },
            },
        },
    })

    async createEntry({
        url,
        timesRetried = 0,
        createdAt = new Date(),
    }: BacklogEntryCreateArgs): Promise<void> {
        await this.operation('createEntry', { url, timesRetried, createdAt })
    }

    async removeOldestEntry(): Promise<BacklogEntry | null> {
        const result = await this.operation('findOldestEntry', {})

        if (result == null) {
            return null
        }

        await this.operation('deleteEntry', { id: result.id })

        return { url: result.url, timesRetried: result.timesRetried }
    }
}
