import { MemexUser } from 'src/authentication/background/types'
import { SubscriptionStatus } from '@worldbrain/memex-common/lib/subscriptions/types'

export function userAuthorizedForReadwise(
    user: Pick<MemexUser, 'subscriptionStatus'> | undefined,
) {
    if (!user) {
        return false
    }

    const wantedStatus: SubscriptionStatus[] = [
        'active',
        'non_renewing',
        'in_trial',
    ]
    return wantedStatus.includes(user.subscriptionStatus)
}
