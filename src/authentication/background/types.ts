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

    hasValidPlan(plan: UserPlan): Promise<boolean>
    getAuthorizedFeatures(): Promise<UserFeature[]>
    getAuthorizedPlans(): Promise<UserPlan[]>
    getSubscriptionStatus(): Promise<SubscriptionStatus>
    getSubscriptionExpiry(): Promise<number | null>
    isAuthorizedForFeature(feature: UserFeature): Promise<boolean>

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

export type MemexUser = {
    authorizedFeatures: UserFeature[]
    authorizedPlans: UserPlan[]
    subscriptionStatus: SubscriptionStatus
    subscriptionExpiry: number | null
} & AuthenticatedUser
