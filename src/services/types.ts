import type { AuthService } from '@worldbrain/memex-common/ts/authentication/types'
import type { SubscriptionsService } from '@worldbrain/memex-common/ts/subscriptions/types'
import type { ActivityStreamsService } from '@worldbrain/memex-common/ts/activity-streams/types'
import type { ListKeysServiceInterface } from '@worldbrain/memex-common/ts/content-sharing/service/types'
import type { ContentConversationsServiceInterface } from '@worldbrain/memex-common/ts/content-conversations/service/types'

export interface Services {
    activityStreams: ActivityStreamsService
    contentSharing: ListKeysServiceInterface
    contentConversations: ContentConversationsServiceInterface
}

export interface AuthServices {
    auth: AuthService
    subscriptions: SubscriptionsService
}
