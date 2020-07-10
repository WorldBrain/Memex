import StorageManager from '@worldbrain/storex'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import ContentSharingStorage from 'src/content-sharing/background/storage'

export interface ServerStorage {
    storageManager: StorageManager
    storageModules: {
        contentSharing: ContentSharingStorage
        sharedSyncLog: SharedSyncLogStorage
    }
}
