import StorageManager from '@worldbrain/storex'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'

export function createSharedSyncLog(serverStorageManager: StorageManager) {
    const sharedSyncLog = new SharedSyncLogStorage({
        storageManager: serverStorageManager,
        autoPkType: 'string',
    })
    return sharedSyncLog
}
