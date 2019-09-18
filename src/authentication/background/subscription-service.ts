import {
    SubscriptionInterface,
    SubscriptionCheckoutOptions,
} from 'src/authentication/background/types'
import { AuthService } from 'src/authentication/background/auth-service'

export class SubscriptionService {
    private subscription: SubscriptionInterface<any>
    private readonly auth: AuthService

    public constructor(
        subscriptionImplementation: SubscriptionInterface<any>,
        auth: AuthService,
    ) {
        this.subscription = subscriptionImplementation
        this.auth = auth
    }

    public async checkout(options: SubscriptionCheckoutOptions) {
        return this.subscription.checkout(this.auth, options)
    }
}
