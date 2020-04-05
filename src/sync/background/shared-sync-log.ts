import StorageManager from '@worldbrain/storex'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import { createServerStorageManager } from 'src/storage/server'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

export function createLazySharedSyncLog(): () => Promise<SharedSyncLogStorage> {
    let sharedSyncLog: SharedSyncLogStorage
    return async () => {
        if (!sharedSyncLog) {
            const serverStorageManager = createServerStorageManager()
            sharedSyncLog = new SharedSyncLogStorage({
                storageManager: serverStorageManager,
                autoPkType: 'string',
            })
            registerModuleMapCollections(serverStorageManager.registry, {
                sharedSyncLog,
            })
            await serverStorageManager.finishInitialization()
        }
        return sharedSyncLog
    }
}
