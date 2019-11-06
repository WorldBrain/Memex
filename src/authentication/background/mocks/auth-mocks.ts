import {
    AuthEvents,
    AuthInterface,
    Claims,
} from 'src/authentication/background/types'
import { RemoteEventEmitter } from 'src/util/webextensionRPC'

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

    constructor(options: { expiry?: number } = {}) {
        const { expiry } = options
        if (expiry != null) {
            this.claims.subscriptions['backup-monthly'] = { expiry }
            this.claims.subscriptions['sync-monthly'] = { expiry }
            this.claims.features['backup'] = { expiry }
            this.claims.features['sync'] = { expiry }
        }
    }

    static validSubscriptions = () =>
        new MockAuthImplementation({
            expiry: Date.now() + 10000 + 1000 * 60 * 60,
        })
    static expiredSubscriptions = () =>
        new MockAuthImplementation({
            expiry: Date.now() - 1000 - 1000 * 60 * 60,
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
}
