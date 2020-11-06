import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import {
    UserFeature,
    UserPlan,
    Claims,
    SubscriptionStatus,
} from '@worldbrain/memex-common/lib/subscriptions/types'

export interface AuthRemoteFunctionsInterface {
    getCurrentUser(): Promise<AuthenticatedUser | null>
    signOut(): void
    refreshUserInfo(): Promise<void>

    getUserProfile(): Promise<{ displayName?: string } | null>
    updateUserProfile(updates: { displayName: string }): Promise<void>

    hasValidPlan(plan: UserPlan): Promise<boolean>
    getAuthorizedFeatures(): Promise<UserFeature[]>
    getAuthorizedPlans(): Promise<UserPlan[]>
    getSubscriptionStatus(): Promise<SubscriptionStatus>
    getSubscriptionExpiry(): Promise<number | null>
    isAuthorizedForFeature(feature: UserFeature): Promise<boolean>
    setBetaEnabled(enabled: boolean): Promise<void>

    hasSubscribedBefore(): Promise<boolean>
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
