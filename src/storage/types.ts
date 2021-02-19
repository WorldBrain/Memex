import StorageManager from '@worldbrain/storex'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import { ContentSharingStorage } from 'src/content-sharing/background/storage'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import ContentConversationStorage from '@worldbrain/memex-common/lib/content-conversations/storage'
import ActivityStreamsStorage from '@worldbrain/memex-common/lib/activity-streams/storage'

export interface ServerStorage {
    storageManager: StorageManager
    storageModules: {
        contentConversations: ContentConversationStorage
        activityStreams: ActivityStreamsStorage
        contentSharing: ContentSharingStorage
        sharedSyncLog: SharedSyncLogStorage
        userManagement: UserStorage
    }
}
