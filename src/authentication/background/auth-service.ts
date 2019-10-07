import {
    AuthInterface,
    AuthRemoteFunctionsInterface,
    Claims,
} from 'src/authentication/background/types'

export type plans = 'free' | 'pro'

export class AuthSubscriptionError extends Error {}
export class AuthSubscriptionInvalid extends AuthSubscriptionError {}
export class AuthSubscriptionNotPresent extends AuthSubscriptionInvalid {}
export class AuthSubscriptionExpired extends AuthSubscriptionInvalid {}

export class AuthService implements AuthRemoteFunctionsInterface {
    private readonly auth: AuthInterface

    public constructor(authImplementation: AuthInterface) {
        this.auth = authImplementation
    }

    public getUser = () => this.auth.getCurrentUser()
    private getUserClaims = () => this.auth.getUserClaims()
    public refresh = () => this.auth.refresh()

    /**
     *  Checks that a client has a valid subscription (exists, is not expired)
     *  to the provided plan.
     */
    public checkValidPlan = async (plan: plans): Promise<boolean> => {
        if (plan === 'free') {
            return true
        }

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

    public async hasSubscribedBefore(): Promise<boolean> {
        const claims = await this.getUserClaims()
        // todo: (ch) make typesafe
        return claims['subscriptions']['pro'] != null
    }
}
