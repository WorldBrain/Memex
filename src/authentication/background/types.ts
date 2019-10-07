import { AuthService } from 'src/authentication/background/auth-service'
import {
    FirebaseFunctionsAuth,
    FirebaseFunctionsSubscription,
} from 'src/authentication/background/firebase-functions-subscription'

export interface AuthenticatedUser {
    displayName: string | null
    email: string | null
    uid: string
    subscription?: { [key: string]: boolean }
}

export interface AuthInterface {
    getCurrentUser(): Promise<AuthenticatedUser | null>

    getUserClaims(): Promise<Claims>

    refresh(): Promise<AuthenticatedUser | null>
}

// These are key-values that a client is verified to have by authenticating, e.g. Coming from a JWT token.
export interface Claims {
    subscriptions: { [key: string]: { expiry: number } }

    [key: string]: any
}

export interface SubscriptionCheckoutOptions {
    planId: string
}

// todo (ch): Type options
export interface SubscriptionServerFunctionsInterface {
    getCheckoutLink(options: SubscriptionCheckoutOptions): Promise<string>

    getManageLink(options: SubscriptionCheckoutOptions): Promise<string>
}

export interface AuthServerFunctionsInterface {
    refreshUserClaims(): Promise<any>
}

export interface AuthRemoteFunctionsInterface {
    getUser(): Promise<AuthenticatedUser | null>

    refresh(): Promise<AuthenticatedUser | null>

    hasValidPlan(plan): Promise<boolean>
    // isAuthorizedForFeature(feature): boolean

    hasSubscribedBefore(): any
}

export interface AuthEvents {
    onAuthStateChanged: (user: AuthenticatedUser) => void
}

export interface AuthBackground {
    authService: AuthService
    subscriptionServerFunctions: FirebaseFunctionsSubscription
    authServerFunctions: FirebaseFunctionsAuth
}
