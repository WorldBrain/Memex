import type { AuthService } from '@worldbrain/memex-common/lib/authentication/types'
import type { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import type { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'
import type { ListKeysServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { ContentConversationsServiceInterface } from '@worldbrain/memex-common/lib/content-conversations/service/types'

export interface Services {
    activityStreams: ActivityStreamsService
    contentSharing: ListKeysServiceInterface
    contentConversations: ContentConversationsServiceInterface
}

export interface AuthServices {
    auth: AuthService
    subscriptions: SubscriptionsService
}
