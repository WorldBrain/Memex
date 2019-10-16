import {
    AuthEvents,
    AuthInterface,
    AuthRemoteFunctionsInterface,
    Claims,
} from 'src/authentication/background/types'
import { RemoteEventEmitter } from 'src/util/webextensionRPC'

export type plans = string

export class AuthSubscriptionError extends Error {}
export class AuthSubscriptionInvalid extends AuthSubscriptionError {}
export class AuthSubscriptionNotPresent extends AuthSubscriptionInvalid {}
export class AuthSubscriptionExpired extends AuthSubscriptionInvalid {}

export class AuthService implements AuthRemoteFunctionsInterface {
    private readonly auth: AuthInterface

    public constructor(authImplementation: AuthInterface) {
        this.auth = authImplementation
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
    public checkValidPlan = async (plan: plans): Promise<boolean> => {
        const claims = await this.getUserClaims()

        const subscriptionExpiry = this.subscriptionExpiryAccessor(claims)(plan)

        if (!subscriptionExpiry) {
            throw new AuthSubscriptionNotPresent()
        }

        if (Date.now() >= subscriptionExpiry) {
            throw new AuthSubscriptionExpired()
        }

        return true
    }

    private subscriptionExpiryAccessor = claims => (
        plan: plans,
    ): keyof Claims =>
        claims != null &&
        claims.subscriptions != null &&
        claims.subscriptions[plan] != null
            ? claims.subscriptions[plan].expiry
            : null

    private featureExpiryAccessor = claims => (feature: string): keyof Claims =>
        claims != null &&
        claims.features != null &&
        claims.features[feature] != null
            ? claims.features[feature].expiry
            : null

    /**
     * As above but does not throw errors.
     */
    public async hasValidPlan(plan: plans): Promise<boolean> {
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
        // todo: (ch) test timezones
        return expiry != null && expiry > Date.now()
    }

    public async hasSubscribedBefore(): Promise<boolean> {
        const claims = await this.getUserClaims()
        return (
            claims.subscriptions != null &&
            Object.keys(claims.subscriptions).length > 0
        )
    }
}
