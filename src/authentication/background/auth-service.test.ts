import * as expect from 'expect'
import {
    AuthService,
    AuthSubscriptionExpired,
    AuthSubscriptionInvalid,
    AuthSubscriptionNotPresent,
} from 'src/authentication/background/auth-service'
import {
    AuthInterface,
    Claims,
    LinkGeneratorInterface,
    subscriptionEventKeys,
} from 'src/authentication/background/types'
import { SubscriptionService } from 'src/authentication/background/subscription-service'
import {
    ChargebeeInterface,
    SubscriptionChargebeeFirebase,
} from 'src/authentication/background/subscription-chargebee-firebase'
const sinon = require('sinon')

describe('Authentication Subscription Status Tests', () => {
    it('should not be subscribed to pro plan if user is new', async () => {
        const authService = new AuthService(MockAuthImplementation.newUser())

        expect(authService.checkValidPlan('pro')).rejects.toThrowError(
            AuthSubscriptionNotPresent,
        )
        expect(await authService.checkValidPlanQuiet('pro')).toBeFalsy()
    })

    it('should not be subscribed to pro plan if subscription expired', async () => {
        const authService = new AuthService(
            MockAuthImplementation.expiredProSubscription(),
        )

        expect(authService.checkValidPlan('pro')).rejects.toThrowError(
            AuthSubscriptionExpired,
        )
        expect(await authService.checkValidPlanQuiet('pro')).toBeFalsy()
    })

    it('should be subscribed to pro plan if subscription is valid', async () => {
        const authService = new AuthService(
            MockAuthImplementation.validProSubscription(),
        )

        expect(await authService.checkValidPlan('pro')).toBeTruthy()
        expect(await authService.checkValidPlanQuiet('pro')).toBeTruthy()
    })
})

function mockSubscriptionService() {
    const authService = new AuthService(MockAuthImplementation.newUser())
    return new SubscriptionService(
        new SubscriptionChargebeeFirebase(
            new MockLinkGenerator(),
            new MockChargebeeInstance(),
        ),
        authService,
    )
}

describe('Authentication Subscription Checkout Tests', () => {
    it('checkout should first return a link to check the user out', async () => {
        const spy = sinon.spy()

        const subscriptionService = mockSubscriptionService()

        const checkoutEmitter = await subscriptionService.checkout({
            subscriptionPlanId: 'pro',
        })
        subscriptionEventKeys.forEach(key => checkoutEmitter.on(key, spy))

        spy.firstCall.calledWith(['externalUrl'])
    })

    it('should complete the checkout process', async () => {
        const spy = sinon.spy()

        const subscriptionService = mockSubscriptionService()

        const checkoutEmitter = await subscriptionService.checkout({
            subscriptionPlanId: 'pro',
        })
        subscriptionEventKeys.forEach(key => checkoutEmitter.on(key, spy))

        const expectedCalls = [['started', '']]

        for (let i = 0; i < expectedCalls.length; i++) {
            spy.getCall(i).calledWith(expectedCalls[i])
        }
    })
})

class MockChargebeeInstance implements ChargebeeInterface {
    openCheckout = ({ hostedPage, success, close, step }) => ({
        hostedPage: () => hostedPage(),
        step: () => step(),
        success: () => success(),
        close: () => close(),
    })
}
class MockLinkGenerator implements LinkGeneratorInterface {
    static checkoutLink = 'https://checkout.example-test.com'
    static manageLink = 'https://manage.example-test.com'
    checkout = async options => MockLinkGenerator.checkoutLink
    manage = async options => MockLinkGenerator.manageLink
}

class MockAuthImplementation implements AuthInterface {
    private readonly claims: Claims = {}

    constructor(options: { expiry?: number } = {}) {
        const { expiry } = options

        if (expiry) {
            this.claims = {
                subscription_pro_expiry: expiry,
            }
        }
    }

    static validProSubscription = () =>
        new MockAuthImplementation({ expiry: Date.now() + 1000 })
    static expiredProSubscription = () =>
        new MockAuthImplementation({ expiry: Date.now() - 1000 })
    static newUser = () => new MockAuthImplementation()

    async getCurrentUser() {
        return { id: 'test' }
    }
    async getUserClaims() {
        return this.claims
    }

    refresh() {
        return null
    }
}
