import { AuthService } from '@worldbrain/memex-common/lib/authentication/types'
import { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'

export interface Services {
    auth: AuthService
    subscriptions: SubscriptionsService
    activityStreams: ActivityStreamsService
}
