import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { STORAGE_VERSIONS } from 'src/storage/constants'

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
}
