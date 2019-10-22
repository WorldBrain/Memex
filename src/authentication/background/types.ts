import { RemoteEventEmitter } from 'src/util/webextensionRPC'
import { Claims } from 'firebase-backend/firebase/functions/src/types'
export interface AuthenticatedUser {
    displayName: string | null
    email: string | null
    emailVerified: boolean
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

export interface SubscriptionCheckoutOptions {
    planId: string
}

export interface SubscriptionServerFunctionsInterface {
    getCheckoutLink(options: SubscriptionCheckoutOptions): Promise<string>
    getManageLink(options?: SubscriptionCheckoutOptions): Promise<string>
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
    onAuthStateChanged: (user: AuthenticatedUserWithClaims) => void
}
