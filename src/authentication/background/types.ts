import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import {
    UserFeature,
    UserPlan,
    Claims,
} from '@worldbrain/memex-common/lib/subscriptions/types'

export interface AuthRemoteFunctionsInterface {
    getCurrentUser(): Promise<AuthenticatedUser | null>
    refreshUserInfo(): Promise<void>

    hasValidPlan(plan: UserPlan): Promise<boolean>
    getAuthorizedFeatures(): Promise<UserFeature[]>

    hasSubscribedBefore(): Promise<boolean>
}

export interface AuthRemoteEvents {
    onAuthStateChanged: (
        user: (AuthenticatedUser & { claims: Claims }) | null,
    ) => void
}
