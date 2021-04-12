import { AuthService } from '@worldbrain/memex-common/lib/authentication/types'
import { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'
import { ContentSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'

export interface Services {
    auth: AuthService
    subscriptions: SubscriptionsService
    activityStreams: ActivityStreamsService
    contentSharing: ContentSharingServiceInterface
}
