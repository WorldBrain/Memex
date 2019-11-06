import {
    AuthEvents,
    AuthInterface,
    AuthRemoteFunctionsInterface,
    Claims,
    UserFeatures,
    UserPlans,
} from 'src/authentication/background/types'

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

    // TODO: (ch) (opt-out-auth): to allow the user to enable/disabled auth we also need to re-initialise the background auth service
    // static get isEnabledByUser() {
    //     return localStorage.getItem('AUTH_ENABLED') === 'true'
    // }
    // static setEnabledByUser() {
    //     localStorage.setItem('AUTH_ENABLED', 'true')
    // }

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
        claims.subscriptions[plan] != null
            ? claims.subscriptions[plan].expiry
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

    public getAuthorizedFeatures = async (): Promise<UserFeatures[]> => {
        const claims = await this.getUserClaims()
        const features = [] as UserFeatures[]

        if (claims == null || claims.features == null) {
            return features
        }

        Object.keys(claims.features).forEach((feature: UserFeatures) => {
            const expiry = claims.features[feature].expiry
            if (
                expiry != null &&
                expiry + subscriptionGraceMs > new Date().getUTCMilliseconds()
            ) {
                features.push(feature)
            }
        })

        return features
    }

    public async hasSubscribedBefore(): Promise<boolean> {
        const claims = await this.getUserClaims()
        return (
            claims.subscriptions != null &&
            Object.keys(claims.subscriptions).length > 0
        )
    }
}
