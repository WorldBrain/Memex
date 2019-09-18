import TypedEmitter from 'typed-emitter'
import { AuthService } from 'src/authentication/background/auth-service'
interface AuthenticatedUser {
    id: string
}

export interface AuthInterface {
    getCurrentUser(): Promise<AuthenticatedUser | null>
    getUserClaims(): Promise<Claims>
    refresh(): Promise<AuthenticatedUser | null>
}

// These are key-values that a client is verified to have by authenticating, e.g. Coming from a JWT token.
export interface Claims {
    subscriptions: { [key: string]: { refreshAt: number } }
    [key: string]: any
}

export interface SubscriptionInterface<T> {
    checkout(
        auth: AuthService,
        options: SubscriptionCheckoutOptions,
    ): Promise<SubscriptionEventEmitter<T>>
    manage(): TypedEmitter<any>
}

export type SubscriptionEventEmitter<T> = TypedEmitter<SubscriptionEvents<T>>

export interface SubscriptionCheckoutOptions {
    subscriptionPlanId: string
}

export interface SubscriptionEvents<T> {
    error: (error: Error) => void
    externalUrl: (url: string) => void
    started: () => void
    closed: () => void
    success: (id: string) => void
    subscriptionStepChanged: (stepType: T) => void
}

export const subscriptionEventKeys: Array<keyof SubscriptionEvents<any>> = [
    'error',
    'externalUrl',
    'started',
    'closed',
    'success',
    'subscriptionStepChanged',
]

export interface LinkGeneratorInterface {
    checkout(options: CheckoutLinkOptions): Promise<string>
    manage(options: CheckoutLinkOptions): Promise<string>
}

export interface CheckoutLinkOptions {
    userId: string
}

export interface AuthRemoteFunctionsInterface {
    getUser(): Promise<AuthenticatedUser | null>
    refresh(): Promise<AuthenticatedUser | null>
    checkValidPlan(plan): any
    hasSubscribedBefore(): any
}
