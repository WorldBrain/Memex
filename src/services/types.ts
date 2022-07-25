import type { AuthService } from '@worldbrain/memex-common/lib/authentication/types'
import type { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import type { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'
import type { ListSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { ContentConversationsServiceInterface } from '@worldbrain/memex-common/lib/content-conversations/service/types'

export interface Services {
    auth: AuthService
    subscriptions: SubscriptionsService
    activityStreams: ActivityStreamsService
    contentSharing: ListSharingServiceInterface
    contentConversations: ContentConversationsServiceInterface
}
