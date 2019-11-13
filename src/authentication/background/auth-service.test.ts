import expect from 'expect'
import {
    AuthService,
    AuthSubscriptionExpired,
    AuthSubscriptionNotPresent,
} from 'src/authentication/background/auth-service'
import { MockAuthImplementation } from 'src/authentication/background/mocks/auth-mocks'

const testSubscriptionKey = 'pro-1-device'

describe('Authentication Subscription Status Tests', () => {
    it('should not be subscribed to pro-1-device plan if user is new', async () => {
        const authService = new AuthService(MockAuthImplementation.newUser())

        expect(await authService.hasValidPlan(testSubscriptionKey)).toBeFalsy()
        expect(
            authService.checkValidPlan(testSubscriptionKey),
        ).rejects.toThrowError(AuthSubscriptionNotPresent)
    })

    it('should not be subscribed to pro-1-device plan if subscription expired', async () => {
        const authService = new AuthService(
            MockAuthImplementation.expiredSubscriptions(testSubscriptionKey),
        )

        expect(await authService.hasValidPlan(testSubscriptionKey)).toBeFalsy()
        expect(
            authService.checkValidPlan(testSubscriptionKey),
        ).rejects.toThrowError(AuthSubscriptionExpired)
    })

    it('should be subscribed to pro-1-device plan if subscription is valid', async () => {
        const authService = new AuthService(
            MockAuthImplementation.validSubscriptions(testSubscriptionKey),
        )

        expect(
            await authService.checkValidPlan(testSubscriptionKey),
        ).toBeTruthy()
        expect(await authService.hasValidPlan(testSubscriptionKey)).toBeTruthy()
    })
})
