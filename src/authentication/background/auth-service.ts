import { AuthInterface, Claims } from 'src/authentication/background/types'

export type plans = 'free' | 'pro'

export class AuthSubscriptionError extends Error {}
export class AuthSubscriptionInvalid extends AuthSubscriptionError {}
export class AuthSubscriptionNotPresent extends AuthSubscriptionInvalid {}
export class AuthSubscriptionExpired extends AuthSubscriptionInvalid {}

export class AuthService {
    private auth: AuthInterface

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

    public async hasSubscribedBefore(): Promise<boolean> {
        const claims = await this.getUserClaims()
        return claims[this.subscriptionExpiryKey('pro')] != null
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
}
