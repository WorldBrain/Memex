import TypedEmitter from 'typed-emitter'
import { AuthService } from 'src/authentication/background/auth-service'
import {
    ChargebeeInterface,
    ChargeeCheckoutStepEvents,
    ChargeeManageStepEvents,
} from 'src/authentication/background/auth-firebase-chargebee'
interface AuthenticatedUser {
    id: string
}

export interface AuthInterface<T> {
    getCurrentUser(): Promise<AuthenticatedUser | null>
    getUserClaims(): Promise<Claims>
    refresh(): Promise<AuthenticatedUser | null>
    subscription: T
}

// These are key-values that a client is verified to have by authenticating, e.g. Coming from a JWT token.
export interface Claims {
    subscriptions: { [key: string]: { refreshAt: number } }
    [key: string]: any
}

export type SubscriptionCheckoutEventEmitter<T> = TypedEmitter<
    SubscriptionEvents<T>
>
export type SubscriptionManageEventEmitter<T> = TypedEmitter<
    SubscriptionEvents<T>
>

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

export interface SubscriptionRemoteFunctionsInterface {
    checkout(
        options: SubscriptionCheckoutOptions,
        cbInstance: ChargebeeInterface,
    ): Promise<SubscriptionCheckoutEventEmitter<ChargeeCheckoutStepEvents>>
    manage(
        cbInstance: ChargebeeInterface,
    ): Promise<SubscriptionManageEventEmitter<ChargeeManageStepEvents>>
}
