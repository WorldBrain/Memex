import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import type {
    UserFeature,
    UserPlan,
    Claims,
    SubscriptionStatus,
} from '@worldbrain/memex-common/lib/subscriptions/types'
import type {
    UserReference,
    User,
} from '@worldbrain/memex-common/lib/web-interface/types/users'

export interface AuthRemoteFunctionsInterface {
    getCurrentUser(): Promise<AuthenticatedUser | null>
    signOut(): void
    refreshUserInfo(): Promise<void>

    getUserProfile(): Promise<{ displayName?: string } | null>
    getUserByReference(reference: UserReference): Promise<User | null>
    updateUserProfile(updates: { displayName: string }): Promise<void>

    hasValidPlan(plan: UserPlan): Promise<boolean>
    getAuthorizedFeatures(): Promise<UserFeature[]>
    getAuthorizedPlans(): Promise<UserPlan[]>
    getSubscriptionStatus(): Promise<SubscriptionStatus>
    getSubscriptionExpiry(): Promise<number | null>
    isAuthorizedForFeature(feature: UserFeature): Promise<boolean>

    hasSubscribedBefore(): Promise<boolean>
    registerWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: RegistrationResult }>
    loginWithEmailPassword(
        options: EmailPasswordCredentials,
    ): Promise<{ result: LoginResult }>
}

export interface AuthRemoteEvents {
    onAuthStateChanged: (
        user: (AuthenticatedUser & { claims: Claims }) | null,
    ) => void

    onLoadingUser: (loading: boolean) => void
}

export interface AuthContextInterface {
    currentUser: MemexUser
    loadingUser: boolean
}

export interface AuthBackendFunctions {
    registerBetaUser(params: {}): Promise<void>
}

export type MemexUser = {
    authorizedFeatures: UserFeature[]
    authorizedPlans: UserPlan[]
    subscriptionStatus: SubscriptionStatus
    subscriptionExpiry: number | null
} & AuthenticatedUser

export interface AuthSettings {
    beta?: boolean
}

export interface EmailPasswordCredentials {
    email: string
    password: string
    displayName: string
}
export interface AuthRequest {
    reason?: AuthRequestReason
    header?: { title: string; subtitle?: string }
}
export type AuthRequestReason = 'login-requested' | 'registration-requested'

export type AuthResult = LoginResult | RegistrationResult
export type AuthError = LoginError | RegistrationError
export type LoginResult =
    | {
          status: 'authenticated' | 'cancelled'
      }
    | LoginError
export interface LoginError {
    status: 'error'
    reason:
        | 'popup-blocked'
        | 'invalid-email'
        | 'user-not-found'
        | 'wrong-password'
        | 'unknown'
    internalReason?: string
}

export type RegistrationResult =
    | {
          status: 'registered-and-authenticated' | 'cancelled'
      }
    | RegistrationError
export interface RegistrationError {
    status: 'error'
    reason: 'invalid-email' | 'email-exists' | 'weak-password' | 'unknown'
    internalReason?: string
}
