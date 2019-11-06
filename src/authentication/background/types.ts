import { RemoteEventEmitter } from 'src/util/webextensionRPC'

// These are key-values that a client is verified to have by authenticating, e.g. Coming from a JWT token.
export interface Claims {
    subscriptions: SubscriptionMap
    features: FeatureMap
    lastSubscribed: number | null
}
export interface SubscriptionMap {
    [key: string]: { expiry: number }
}
export interface FeatureMap {
    [key: string]: { expiry: number }
}
export type UserFeatures = 'backup' | 'sync'
export type UserPlans =
    | 'free'
    | 'backup-monthly'
    | 'backup-yearly'
    | 'sync-monthly'
    | 'sync-yearly'

export interface AuthenticatedUser {
    displayName: string | null
    email: string | null
    emailVerified: boolean
    uid: string
}

export interface AuthenticatedUserWithClaims extends AuthenticatedUser {
    claims: Claims | null
}

export interface AuthInterface {
    getCurrentUser(): Promise<AuthenticatedUser | null>
    getUserClaims(): Promise<Claims>
    refresh(): Promise<void>
    registerAuthEmitter(emitter: RemoteEventEmitter<AuthEvents>): void
}

export interface SubscriptionCheckoutOptions {
    planId: string
}

export interface SubscriptionServerFunctionsInterface {
    getCheckoutLink(options: SubscriptionCheckoutOptions): Promise<string>
    getManageLink(options?: SubscriptionCheckoutOptions): Promise<string>
}

export interface AuthServerFunctionsInterface {
    refreshUserClaims(): Promise<any>
    getCustomLoginToken(): Promise<string>
}

export interface AuthRemoteFunctionsInterface {
    getUser(): Promise<AuthenticatedUser | null>
    refresh(): Promise<void>

    hasValidPlan(plan): Promise<boolean>
    getAuthorizedFeatures(): Promise<UserFeatures[]>

    hasSubscribedBefore(): Promise<boolean>
}

export interface AuthEvents {
    onAuthStateChanged: (user: AuthenticatedUserWithClaims) => void
}
