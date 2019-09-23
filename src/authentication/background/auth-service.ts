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

export class AuthService<T> implements AuthRemoteFunctionsInterface {
    private readonly auth: AuthInterface<T>

    public constructor(authImplementation: AuthInterface<T>) {
        this.auth = authImplementation
    }

    public getUser = () => this.auth.getCurrentUser()
    private getUserClaims = () => this.auth.getUserClaims()
    public refresh = () => this.auth.refresh()

    public get subscription() {
        return this.auth.subscription
    }

    /**
     *  Checks that a client has a valid subscription (exists, is not expired)
     *  to the provided plan.
     */
    public async checkValidPlan(plan: plans): Promise<boolean> {
        if (plan === 'free') {
            return true
        }

        const claims = await this.getUserClaims()
        const subscriptionExpiry: number =
            claims[this.subscriptionExpiryKey(plan)]

        if (!subscriptionExpiry) {
            throw new AuthSubscriptionNotPresent()
        }

        if (Date.now() >= subscriptionExpiry) {
            throw new AuthSubscriptionExpired()
        }

        return true
    }

    private subscriptionExpiryKey = (plan: plans): keyof Claims =>
        `subscription_${plan}_expiry`

    /**
     * As above but does not throw errors.
     */
    public async checkValidPlanQuiet(plan: plans): Promise<boolean> {
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
