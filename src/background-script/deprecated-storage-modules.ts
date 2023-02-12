import type Storex from '@worldbrain/storex'
import { ActionQueueStorage } from '@worldbrain/memex-common/lib/action-queue/storage'
import { PageFetchBacklogStorage } from 'src/page-fetch-backlog/background/storage'
import {
    MemexExtClientSyncLogStorage,
    MemexExtSyncInfoStorage,
} from 'src/sync/background/storage'
import { STORAGE_VERSIONS } from 'src/storage/constants'

export default class DeprecatedStorageModules {
    syncInfoStorage: MemexExtSyncInfoStorage
    clientSyncLogStorage: MemexExtClientSyncLogStorage
    pageFetchBacklogStorage: PageFetchBacklogStorage
    readwiseActionQueueStorage: ActionQueueStorage<any>

    constructor({ storageManager }: { storageManager: Storex }) {
        this.syncInfoStorage = new MemexExtSyncInfoStorage({ storageManager })
        this.clientSyncLogStorage = new MemexExtClientSyncLogStorage({
            storageManager,
        })
        this.pageFetchBacklogStorage = new PageFetchBacklogStorage({
            storageManager,
        })
        this.readwiseActionQueueStorage = new ActionQueueStorage({
            storageManager,
            collectionName: 'readwiseAction',
            versions: { initial: STORAGE_VERSIONS[22].version },
        })
    }
}
