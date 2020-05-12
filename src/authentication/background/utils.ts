import {
    UserPlan,
    Claims,
    UserFeature,
    SubscriptionStatus,
} from '@worldbrain/memex-common/lib/subscriptions/types'

export function hasSubscribedBefore(claims: Claims): boolean {
    return (
        claims?.lastSubscribed != null ||
        (claims?.subscriptions != null &&
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
        if (isExpiryInFuture(claims.features[feature])) {
            features.push(feature)
        }
    })

    return features
}

export function getAuthorizedPlans(claims: Claims): UserPlan[] {
    const plans = [] as UserPlan[]

    if (claims == null || claims.subscriptions == null) {
        return plans
    }

    for (const [planName, plan] of Object.entries(claims.subscriptions)) {
        if (isExpiryInFuture(plan)) {
            plans.push(planName as UserPlan)
        }
    }

    return plans
}

export function isAuthorizedForFeature(
    claims: Claims,
    feature: UserFeature,
): boolean {
    if (claims != null && claims.features != null) {
        const featureObject = claims.features[feature]
        return isExpiryInFuture(featureObject)
    }
    return false
}

const nowInSecs = () => Math.round(new Date().getTime() / 1000)

function isExpiryInFuture(object?: { expiry?: number }): boolean {
    return object.expiry != null && object.expiry > nowInSecs()
}

export function checkValidPlan(
    claims: Claims,
    plan: UserPlan,
): { valid: true } | { valid: false; reason: 'not-present' | 'expired' } {
    const subscriptionExpiry = getSubscriptionExpirationTimestamp(claims, plan)

    if (!subscriptionExpiry) {
        return { valid: false, reason: 'not-present' }
    }

    if (nowInSecs() >= subscriptionExpiry) {
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
        claims?.subscriptions != null &&
        claims?.subscriptions[plan] != null
    return isPresent ? claims?.subscriptions[plan]?.expiry : null
}

export function getSubscriptionStatus(claims: Claims): SubscriptionStatus {
    return claims?.subscriptionStatus
}
