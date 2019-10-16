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
    private readonly claims: Claims = { subscriptions: {} }

    constructor(options: { expiry?: number } = {}) {
        const { expiry } = options

        if (expiry) {
            this.claims.subscriptions = {
                pro: { expiry },
            }
        }
    }

    static validProSubscription = () =>
        new MockAuthImplementation({ expiry: Date.now() + 1000 })
    static expiredProSubscription = () =>
        new MockAuthImplementation({ expiry: Date.now() - 1000 })
    static newUser = () => new MockAuthImplementation()

    async getCurrentUser() {
        return {
            uid: 'test',
            email: 'test@test.com',
            emailVerified: false,
            displayName: 'Test User',
        }
    }

    async getUserClaims() {
        return this.claims
    }

    refresh() {
        return null
    }

    registerAuthEmitter(emitter: RemoteEventEmitter<AuthEvents>): void {}
}
