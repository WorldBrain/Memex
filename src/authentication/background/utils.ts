import {
    UserPlan,
    Claims,
    UserFeature,
    FeatureMap,
    SubscriptionStatus,
} from '@worldbrain/memex-common/lib/subscriptions/types'

export const SUBSCRIPTION_GRACE_MS = 1000 * 60 * 60

export function hasSubscribedBefore(claims: Claims): boolean {
    return (
        claims.lastSubscribed != null ||
        (claims.subscriptions != null &&
            Object.keys(claims.subscriptions).length > 0)
    )
}

export function hasValidPlan(claims: Claims, plan: UserPlan): boolean {
    return checkValidPlan(claims, plan).valid
}

export function getAuthorizedFeatures(claims: Claims): UserFeature[] {
    const features = [] as UserFeature[]

    if (claims == null || claims.features == null) {
        return features
    }

    Object.keys(claims.features).forEach((feature: UserFeature) => {
        if (isFeatureInDate(claims.features[feature])) {
            features.push(feature)
        }
    })

    return features
}

export function isAuthorizedForFeature(
    claims: Claims,
    feature: UserFeature,
): boolean {
    if (claims != null && claims.features != null) {
        const featureObject = claims.features[feature]
        return isFeatureInDate(featureObject)
    }
    return false
}

function isFeatureInDate(
    featureObject?: FeatureMap[keyof FeatureMap],
): boolean {
    return (
        featureObject != null &&
        featureObject.expiry != null &&
        featureObject.expiry + SUBSCRIPTION_GRACE_MS >
            new Date().getUTCMilliseconds()
    )
}

export function checkValidPlan(
    claims: Claims,
    plan: UserPlan,
): { valid: true } | { valid: false; reason: 'not-present' | 'expired' } {
    const subscriptionExpiry = getSubscriptionExpirationTimestamp(claims, plan)

    if (!subscriptionExpiry) {
        return { valid: false, reason: 'not-present' }
    }

    if (Date.now() >= subscriptionExpiry + SUBSCRIPTION_GRACE_MS) {
        return { valid: false, reason: 'expired' }
    }

    return { valid: true }
}

export function getSubscriptionExpirationTimestamp(
    claims: Claims,
    plan: UserPlan,
): number | null {
    const isPresent =
        claims != null &&
        claims.subscriptions != null &&
        claims.subscriptions[plan] != null
    return isPresent ? claims.subscriptions[plan].expiry : null
}

export function getSubscriptionStatus(claims: Claims): SubscriptionStatus {
    return claims.subscriptionStatus
}
