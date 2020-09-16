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
    getSubscriptionStatus,
    getAuthorizedPlans,
} from './utils'
import {
    RemoteEventEmitter,
    remoteEventEmitter,
} from 'src/util/webextensionRPC'
import { AuthRemoteEvents, AuthRemoteFunctionsInterface } from './types'
import { JobDefinition } from 'src/job-scheduler/background/types'
import { isDev } from 'src/analytics/internal/constants'
import { setupRequestInterceptors } from 'src/authentication/background/redirect'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'

export class AuthBackground {
    authService: AuthService
    subscriptionService: SubscriptionsService
    remoteFunctions: AuthRemoteFunctionsInterface
    scheduleJob: (job: JobDefinition) => void
    remoteEmitter: RemoteEventEmitter<AuthRemoteEvents>
    getUserManagement: () => Promise<UserStorage>

    private _userProfile?: Promise<User>

    constructor(options: {
        authService: AuthService
        subscriptionService: SubscriptionsService
        getUserManagement: () => Promise<UserStorage>
        scheduleJob: (job: JobDefinition) => void
    }) {
        this.authService = options.authService
        this.subscriptionService = options.subscriptionService
        this.scheduleJob = options.scheduleJob
        this.remoteEmitter = remoteEventEmitter<AuthRemoteEvents>('auth')
        this.getUserManagement = options.getUserManagement
        this.remoteFunctions = {
            getCurrentUser: () => this.authService.getCurrentUser(),
            signOut: () => this.authService.signOut(),
            refreshUserInfo: () => this.refreshUserInfo(),

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
            getAuthorizedPlans: async () => {
                return getAuthorizedPlans(
                    await this.subscriptionService.getCurrentUserClaims(),
                )
            },
            getSubscriptionExpiry: async () =>
                (await this.subscriptionService.getCurrentUserClaims())
                    ?.subscriptionExpiry,
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
            getUserProfile: async () => {
                if (this._userProfile) {
                    return this._userProfile
                }

                const user = await this.authService.getCurrentUser()
                if (!user) {
                    return null
                }
                const userManagement = await this.getUserManagement()
                this._userProfile = userManagement.getUser({
                    type: 'user-reference',
                    id: user.id,
                })
                return this._userProfile
            },
            updateUserProfile: async (updates) => {
                const user = await this.authService.getCurrentUser()
                if (!user) {
                    return null
                }
                delete this._userProfile

                const userManagement = await this.getUserManagement()
                await userManagement.updateUser(
                    { type: 'user-reference', id: user.id },
                    {},
                    updates,
                )
            },
        }
    }

    refreshUserInfo = async () => {
        await this.remoteEmitter.emit('onLoadingUser', true)
        await this.authService.refreshUserInfo()
        await this.remoteEmitter.emit('onLoadingUser', false)
    }

    setupRequestInterceptor() {
        setupRequestInterceptors({ webRequest: window['browser'].webRequest })
    }

    _scheduleSubscriptionCheck = (
        userWithClaims: AuthenticatedUser & { claims: Claims },
    ) => {
        if (userWithClaims?.claims?.subscriptionExpiry) {
            const when = userWithClaims?.claims?.subscriptionExpiry * 1000
            isDev &&
                console['info'](
                    `Subscription check: scheduled for ${new Date(
                        when,
                    ).toLocaleString()}`,
                )

            this.scheduleJob({
                name: 'user-subscription-expiry-refresh',
                when,
                job: async () => {
                    isDev && console['info'](`Subscription check: running`)
                    const result = await this.authService.refreshUserInfo.bind(
                        this.authService,
                    )()
                    isDev && console['info'](`Subscription check: done`, result)
                },
            })
        } else {
            this.scheduleJob({
                name: 'user-subscription-expiry-refresh',
                when: Date.now(),
                job: () => null,
            })
        }
    }

    registerRemoteEmitter() {
        this.authService.events.on('changed', async ({ user }) => {
            await this.remoteEmitter.emit('onLoadingUser', true)

            const userWithClaims = user
                ? {
                      ...user,
                      claims: await this.subscriptionService.getCurrentUserClaims(),
                  }
                : null
            this._scheduleSubscriptionCheck(userWithClaims)

            if (isDev) {
                const claims = userWithClaims?.claims
                const userDebug = {
                    Status: claims?.subscriptionStatus,
                    Expiry:
                        claims?.subscriptionExpiry &&
                        new Date(
                            claims?.subscriptionExpiry * 1000,
                        ).toLocaleString(),
                    Plans: getAuthorizedPlans(claims),
                }
                console['info'](`User changed:`, userDebug)
            }

            await this.remoteEmitter.emit('onLoadingUser', false)
            await this.remoteEmitter.emit('onAuthStateChanged', userWithClaims)
        })
    }
}
