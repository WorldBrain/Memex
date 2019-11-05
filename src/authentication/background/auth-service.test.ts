import expect from 'expect'
import {
    AuthService,
    AuthSubscriptionExpired,
    AuthSubscriptionNotPresent,
} from 'src/authentication/background/auth-service'
import { MockAuthImplementation } from 'src/authentication/background/mocks/auth-mocks'

const sinon = require('sinon')
describe('Authentication Subscription Status Tests', () => {
    it('should not be subscribed to backup-monthly plan if user is new', async () => {
        const authService = new AuthService(MockAuthImplementation.newUser())

        expect(await authService.hasValidPlan('backup-monthly')).toBeFalsy()
        expect(
            authService.checkValidPlan('backup-monthly'),
        ).rejects.toThrowError(AuthSubscriptionNotPresent)
    })

    it('should not be subscribed to backup-monthly plan if subscription expired', async () => {
        const authService = new AuthService(
            MockAuthImplementation.expiredSubscriptions(),
        )

        expect(await authService.hasValidPlan('backup-monthly')).toBeFalsy()
        expect(
            authService.checkValidPlan('backup-monthly'),
        ).rejects.toThrowError(AuthSubscriptionExpired)
    })

    it('should be subscribed to backup-monthly plan if subscription is valid', async () => {
        const authService = new AuthService(
            MockAuthImplementation.validSubscriptions(),
        )

        expect(await authService.checkValidPlan('backup-monthly')).toBeTruthy()
        expect(await authService.hasValidPlan('backup-monthly')).toBeTruthy()
    })
})
