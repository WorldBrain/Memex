import StorageManager from '@worldbrain/storex'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import { ContentSharingStorage } from 'src/content-sharing/background/storage'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import ContentConversationStorage from '@worldbrain/memex-common/lib/content-conversations/storage'
import ActivityStreamsStorage from '@worldbrain/memex-common/lib/activity-streams/storage'
import ActivityFollowsStorage from '@worldbrain/memex-common/lib/activity-follows/storage'

export type ServerStorageModules = {
    contentConversations: ContentConversationStorage
    activityFollows: ActivityFollowsStorage
    activityStreams: ActivityStreamsStorage
    contentSharing: ContentSharingStorage
    sharedSyncLog: SharedSyncLogStorage
    userManagement: UserStorage
}

export interface ServerStorage {
    storageManager: StorageManager
    storageModules: ServerStorageModules
}
