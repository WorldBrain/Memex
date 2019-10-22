import {
    AuthEvents,
    AuthInterface,
    AuthRemoteFunctionsInterface,
} from 'src/authentication/background/types'
import {
    Claims,
    UserPlans,
    UserFeatures,
} from 'firebase-backend/firebase/functions/src/types'

import { RemoteEventEmitter } from 'src/util/webextensionRPC'

export class AuthSubscriptionError extends Error {}
export class AuthSubscriptionInvalid extends AuthSubscriptionError {}
export class AuthSubscriptionNotPresent extends AuthSubscriptionInvalid {}
export class AuthSubscriptionExpired extends AuthSubscriptionInvalid {}

//
/**
 * Number of milliseconds leeway after a subscription has expired
 * Should be at least as long as the auth implementation's refresh token
 * so for firebase, 1h.
 */
const subscriptionGraceMs = 1000 * 60 * 60

export class AuthService implements AuthRemoteFunctionsInterface {
    private readonly auth: AuthInterface

    public constructor(authImplementation: AuthInterface) {
        this.auth = authImplementation
    }

    // TODO: remove the boolean or
    static get isEnabledByUser() {
        return true || localStorage.getItem('AUTH_ENABLED') === 'true'
    }

    static setEnabledByUser() {
        localStorage.setItem('AUTH_ENABLED', 'true')
    }

    public registerAuthEmitter(emitter: RemoteEventEmitter<AuthEvents>) {
        this.auth.registerAuthEmitter(emitter)
    }

    public getUser = async () => this.auth.getCurrentUser()
    private getUserClaims = async () => this.auth.getUserClaims()
    public refresh = async () => this.auth.refresh()

    /**
     *  Checks that a client has a valid subscription (exists, is not expired)
     *  to the provided plan.
     */
    public checkValidPlan = async (plan: UserPlans): Promise<boolean> => {
        const claims = await this.getUserClaims()

        const subscriptionExpiry = this.subscriptionExpiryAccessor(claims)(plan)

        if (!subscriptionExpiry) {
            throw new AuthSubscriptionNotPresent()
        }

        if (
            new Date().getUTCMilliseconds() >=
            subscriptionExpiry + subscriptionGraceMs
        ) {
            throw new AuthSubscriptionExpired()
        }

        return true
    }

    private subscriptionExpiryAccessor = (claims: Claims) => (
        plan: UserPlans,
    ): number | null =>
        claims != null &&
        claims.subscriptions != null &&
        claims.subscriptions.get(plan) != null
            ? claims.subscriptions.get(plan).expiry
            : null

    private featureExpiryAccessor = claims => (
        feature: UserFeatures,
    ): number | null =>
        claims != null &&
        claims.features != null &&
        claims.features.get(feature) != null
            ? claims.features.get(feature).expiry
            : null

    /**
     * As above but does not throw errors.
     */
    public async hasValidPlan(plan: UserPlans): Promise<boolean> {
        try {
            return await this.checkValidPlan(plan)
        } catch {
            return false
        }
    }

    public async isAuthorizedForFeature(feature): Promise<boolean> {
        const expiry = this.featureExpiryAccessor(await this.getUserClaims())(
            feature,
        )
        return (
            expiry != null &&
            expiry + subscriptionGraceMs > new Date().getUTCMilliseconds()
        )
    }

    public async hasSubscribedBefore(): Promise<boolean> {
        const claims = await this.getUserClaims()
        return (
            claims.subscriptions != null &&
            Object.keys(claims.subscriptions).length > 0
        )
    }
}
