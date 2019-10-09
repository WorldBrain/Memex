import { RemoteEventEmitter } from 'src/util/webextensionRPC'

export interface AuthenticatedUser {
    displayName: string | null
    email: string | null
    uid: string
}

export interface AuthenticatedUserWithClaims extends AuthenticatedUser {
    claims?: Claims | null
}

export interface AuthInterface {
    getCurrentUser(): Promise<AuthenticatedUser | null>
    getUserClaims(): Promise<Claims>
    refresh(): Promise<void>
    registerAuthEmitter(emitter: RemoteEventEmitter<AuthEvents>): void
}

export enum UserFeatures {
    BACKUP = 'backup',
    SYNC = 'sync',
}
export enum UserPlans {
    PRO = 'pro',
}

// These are key-values that a client is verified to have by authenticating, e.g. Coming from a JWT token.
export interface Claims {
    subscriptions?: { [key: string]: { expiry: number } }
    features?: { [key: string]: { expiry: number } }
    [key: string]: any
}

export interface SubscriptionCheckoutOptions {
    planId: string
}

export interface SubscriptionServerFunctionsInterface {
    getCheckoutLink(options: SubscriptionCheckoutOptions): Promise<string>
    getManageLink(options: SubscriptionCheckoutOptions): Promise<string>
}

export interface AuthServerFunctionsInterface {
    refreshUserClaims(): Promise<any>
}

export interface AuthRemoteFunctionsInterface {
    getUser(): Promise<AuthenticatedUser | null>

    refresh(): Promise<void>

    hasValidPlan(plan): Promise<boolean>
    isAuthorizedForFeature(plan): Promise<boolean>

    hasSubscribedBefore(): any
}

export interface AuthEvents {
    onAuthStateChanged: (user: AuthenticatedUser) => void
}
