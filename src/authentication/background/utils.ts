import {
    UserPlan,
    Claims,
    UserFeature,
} from '@worldbrain/memex-common/lib/subscriptions/types'
import { AuthSubscriptionNotPresent, AuthSubscriptionExpired } from './errors'

export const SUBSCRIPTION_GRACE_MS = 1000 * 60 * 60

export function hasSubscribedBefore(claims: Claims): boolean {
    return (
        claims.lastSubscribed != null ||
        (claims.subscriptions != null &&
            Object.keys(claims.subscriptions).length > 0)
    )
}

export function hasValidPlan(claims: Claims, plan: UserPlan): boolean {
    try {
        return checkValidPlan(claims, plan)
    } catch {
        return false
    }
}

export function getAuthorizedFeatures(claims: Claims): UserFeature[] {
    const features = [] as UserFeature[]

    if (claims == null || claims.features == null) {
        return features
    }

    Object.keys(claims.features).forEach((feature: UserFeature) => {
        const expiry = claims.features[feature].expiry
        if (
            expiry != null &&
            expiry + SUBSCRIPTION_GRACE_MS > new Date().getUTCMilliseconds()
        ) {
            features.push(feature)
        }
    })

    return features
}

export function checkValidPlan(claims: Claims, plan: UserPlan): boolean {
    const subscriptionExpiry = getSubscriptionExpirationTimestamp(claims, plan)

    if (!subscriptionExpiry) {
        throw new AuthSubscriptionNotPresent()
    }

    if (
        new Date().getUTCMilliseconds() >=
        subscriptionExpiry + SUBSCRIPTION_GRACE_MS
    ) {
        throw new AuthSubscriptionExpired()
    }

    return true
}

export function getSubscriptionExpirationTimestamp(
    claims: Claims,
    plan: UserPlan,
): number | null {
    return claims != null &&
        claims.subscriptions != null &&
        claims.subscriptions[plan] != null
        ? claims.subscriptions[plan].expiry
        : null
}
