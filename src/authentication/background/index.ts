import {
    AuthenticatedUser,
    AuthService,
} from '@worldbrain/memex-common/lib/authentication/types'
import {
    UserPlan,
    SubscriptionsService,
    UserFeature,
    Claims,
} from '@worldbrain/memex-common/lib/subscriptions/types'
import {
    hasSubscribedBefore,
    hasValidPlan,
    getAuthorizedFeatures,
    isAuthorizedForFeature,
} from './utils'
import { remoteEventEmitter } from 'src/util/webextensionRPC'
import { AuthRemoteEvents, AuthRemoteFunctionsInterface } from './types'
import { JobScheduler } from 'src/job-scheduler/background/job-scheduler'
import { JobDefinition, PrimedJob } from 'src/job-scheduler/background/types'
import { now } from 'moment'

export class AuthBackground {
    authService: AuthService
    subscriptionService: SubscriptionsService
    remoteFunctions: AuthRemoteFunctionsInterface
    scheduleJob: (job: JobDefinition) => void

    constructor(options: {
        authService: AuthService
        subscriptionService: SubscriptionsService
        scheduleJob: (job: JobDefinition) => void
    }) {
        this.authService = options.authService
        this.subscriptionService = options.subscriptionService
        this.scheduleJob = options.scheduleJob
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

    _scheduleSubscriptionCheck = (
        userWithClaims: AuthenticatedUser & { claims: Claims },
    ) => {
        if (userWithClaims) {
            const soonestExpiringSubscription = Object.values(
                userWithClaims.claims.subscriptions,
            ).reduce((prev, val) => (prev.expiry < val.expiry ? prev : val))
            this.scheduleJob({
                name: 'user-subscription-expiry-refresh',
                when: soonestExpiringSubscription.expiry * 1000,
                job: this.authService.refreshUserInfo.bind(this.authService),
            })
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
            this._scheduleSubscriptionCheck(userWithClaims)
            remoteEmitter.emit('onAuthStateChanged', userWithClaims)
        })
    }
}
