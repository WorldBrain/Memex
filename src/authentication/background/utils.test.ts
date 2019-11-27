import expect from 'expect'
import { UserPlan } from '@worldbrain/memex-common/lib/subscriptions/types'
import { createAuthDependencies } from './setup'
import { hasValidPlan, checkValidPlan } from './utils'
import { AuthSubscriptionNotPresent } from './errors'

const TEST_SUBSCRIPTION_KEY: UserPlan = 'pro-1-device'

describe('Authentication Subscription Status Tests', () => {
    it('should not be subscribed to pro-1-device plan if user is new', async () => {
        const { subscriptionService } = createAuthDependencies({
            devAuthState: 'user_signed_out',
        })

        const claims = await subscriptionService.getCurrentUserClaims()
        expect(checkValidPlan(claims, TEST_SUBSCRIPTION_KEY)).toEqual({
            valid: false,
            reason: 'not-present',
        })
        expect(hasValidPlan(claims, TEST_SUBSCRIPTION_KEY)).toBeFalsy()
    })

    it('should not be subscribed to pro-1-device plan if subscription expired', async () => {
        const { subscriptionService } = createAuthDependencies({
            devAuthState: 'user_subscription_expired',
        })

        const claims = await subscriptionService.getCurrentUserClaims()
        expect(checkValidPlan(claims, TEST_SUBSCRIPTION_KEY)).toEqual({
            valid: false,
            reason: 'expired',
        })
        expect(hasValidPlan(claims, TEST_SUBSCRIPTION_KEY)).toBeFalsy()
    })

    it('should be subscribed to pro-1-device plan if subscription is valid', async () => {
        const { subscriptionService } = createAuthDependencies({
            devAuthState: 'user_subscribed',
        })

        const claims = await subscriptionService.getCurrentUserClaims()
        const result = hasValidPlan(
            await subscriptionService.getCurrentUserClaims(),
            TEST_SUBSCRIPTION_KEY,
        )
        expect(checkValidPlan(claims, TEST_SUBSCRIPTION_KEY)).toEqual({
            valid: true,
        })
        expect(result).toBe(true)
    })
})
