import StorageManager from '@worldbrain/storex'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import { ContentSharingStorage } from 'src/content-sharing/background/storage'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'

export interface ServerStorage {
    storageManager: StorageManager
    storageModules: {
        contentSharing: ContentSharingStorage
        sharedSyncLog: SharedSyncLogStorage
        userManagement: UserStorage
    }
}
