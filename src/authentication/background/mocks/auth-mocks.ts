import {
    AuthEvents,
    AuthInterface,
    Claims,
} from 'src/authentication/background/types'
import { RemoteEventEmitter } from 'src/util/webextensionRPC'
import { subscriptionGraceMs } from 'src/authentication/background/auth-service'

export class MockLinkGenerator {
    static checkoutLink = 'https://checkout.example-test.com'
    static manageLink = 'https://manage.example-test.com'
    private readonly checkoutLink: string
    private readonly manageLink: string

    constructor(
        checkoutLink: string = MockLinkGenerator.checkoutLink,
        manageLink: string = MockLinkGenerator.manageLink,
    ) {
        this.checkoutLink = checkoutLink
        this.manageLink = manageLink
    }

    checkout = async options => this.checkoutLink
    manage = async options => this.manageLink
}

export class MockAuthImplementation implements AuthInterface {
    private claims: Claims = {
        subscriptions: {},
        features: {},
        lastSubscribed: null,
    }

    constructor(options: { expiry?: number; subscriptionKey?: string } = {}) {
        const { expiry, subscriptionKey } = options
        if (expiry != null && subscriptionKey != null) {
            this.claims.subscriptions[subscriptionKey] = { expiry }
            this.claims.subscriptions[subscriptionKey] = { expiry }
            this.claims.features['backup'] = { expiry }
            this.claims.features['sync'] = { expiry }
        }
    }

    static validSubscriptions = (subscriptionKey?: string) =>
        new MockAuthImplementation({
            expiry: new Date().getUTCMilliseconds() + 1000,
            subscriptionKey,
        })
    static expiredSubscriptions = (subscriptionKey?: string) =>
        new MockAuthImplementation({
            expiry:
                new Date().getUTCMilliseconds() - 1000 - subscriptionGraceMs,
            subscriptionKey,
        })

    static newUser = () => new MockAuthImplementation()

    public currentUser

    public setCurrentUser(user) {
        this.currentUser = user
    }
    public setCurrentUserToLoggedInUser() {
        this.currentUser = {
            uid: 'test',
            email: 'test@test.com',
            emailVerified: false,
            displayName: 'Test User',
            claims: this.claims,
        }
    }

    public setCurrentUserId(uid) {
        this.currentUser = {
            uid,
            email: 'test@test.com',
            emailVerified: false,
            displayName: 'Test User',
            claims: this.claims,
        }
    }

    async getCurrentUser() {
        return this.currentUser
    }

    async getUserClaims() {
        return this.claims
    }

    refresh() {
        return null
    }

    registerAuthEmitter(emitter: RemoteEventEmitter<AuthEvents>): void {}

    async generateLoginToken() {
        return {
            token: JSON.stringify({
                authMockToken: true,
                user: this.currentUser,
            }),
        }
    }

    async loginWithToken(token: string) {
        const parsed = JSON.parse(token)
        if (!parsed.authMockToken) {
            throw new Error(`Tried to log in with invalid token: ` + token)
        }
        this.currentUser = parsed.user
    }
}
