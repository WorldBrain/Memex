import { AuthService } from '@worldbrain/memex-common/lib/authentication/types'
import {
    UserPlan,
    SubscriptionsService,
    UserFeature,
} from '@worldbrain/memex-common/lib/subscriptions/types'
import {
    hasSubscribedBefore,
    hasValidPlan,
    getAuthorizedFeatures,
    isAuthorizedForFeature,
    getSubscriptionStatus,
} from './utils'
import { remoteEventEmitter } from 'src/util/webextensionRPC'
import { AuthRemoteEvents, AuthRemoteFunctionsInterface } from './types'

export class AuthBackground {
    authService: AuthService
    subscriptionService: SubscriptionsService
    remoteFunctions: AuthRemoteFunctionsInterface

    constructor(options: {
        authService: AuthService
        subscriptionService: SubscriptionsService
    }) {
        this.authService = options.authService
        this.subscriptionService = options.subscriptionService
        this.remoteFunctions = {
            getCurrentUser: () => this.authService.getCurrentUser(),
            signOut: () => this.authService.signOut(),
            refreshUserInfo: () => this.authService.refreshUserInfo(),

            hasValidPlan: async (plan: UserPlan) => {
                return hasValidPlan(
                    await this.subscriptionService.getCurrentUserClaims(),
                    plan,
                )
            },
            getSubscriptionStatus: async () => {
                return getSubscriptionStatus(
                    await this.subscriptionService.getCurrentUserClaims(),
                )
            },
            getAuthorizedFeatures: async () => {
                return getAuthorizedFeatures(
                    await this.subscriptionService.getCurrentUserClaims(),
                )
            },
            isAuthorizedForFeature: async (feature: UserFeature) => {
                return isAuthorizedForFeature(
                    await this.subscriptionService.getCurrentUserClaims(),
                    feature,
                )
            },
            hasSubscribedBefore: async () => {
                return hasSubscribedBefore(
                    await this.subscriptionService.getCurrentUserClaims(),
                )
            },
        }
    }

    registerRemoteEmitter() {
        const remoteEmitter = remoteEventEmitter<AuthRemoteEvents>('auth')
        this.authService.events.on('changed', async ({ user }) => {
            const userWithClaims = user
                ? {
                      ...user,
                      claims: await this.subscriptionService.getCurrentUserClaims(),
                  }
                : null
            remoteEmitter.emit('onAuthStateChanged', userWithClaims)
        })
    }
}
