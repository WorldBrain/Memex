import expect from 'expect'
import {
    AuthService,
    AuthSubscriptionExpired,
    AuthSubscriptionNotPresent,
} from 'src/authentication/background/auth-service'
import { MockAuthImplementation } from 'src/authentication/background/mocks/auth-mocks'

const sinon = require('sinon')
describe('Authentication Subscription Status Tests', () => {
    it('should not be subscribed to pro plan if user is new', async () => {
        const authService = new AuthService(MockAuthImplementation.newUser())

        expect(await authService.hasValidPlan('pro')).toBeFalsy()
        expect(authService.checkValidPlan('pro')).rejects.toThrowError(
            AuthSubscriptionNotPresent,
        )
    })

    it('should not be subscribed to pro plan if subscription expired', async () => {
        const authService = new AuthService(
            MockAuthImplementation.expiredProSubscription(),
        )

        expect(await authService.hasValidPlan('pro')).toBeFalsy()
        expect(authService.checkValidPlan('pro')).rejects.toThrowError(
            AuthSubscriptionExpired,
        )
    })

    it('should be subscribed to pro plan if subscription is valid', async () => {
        const authService = new AuthService(
            MockAuthImplementation.validProSubscription(),
        )

        expect(await authService.checkValidPlan('pro')).toBeTruthy()
        expect(await authService.hasValidPlan('pro')).toBeTruthy()
    })
})
