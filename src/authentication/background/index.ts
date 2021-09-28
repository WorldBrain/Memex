import type StorageManager from '@worldbrain/storex'
import type {
    AuthenticatedUser,
    AuthService,
} from '@worldbrain/memex-common/lib/authentication/types'
import type {
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
import type { RemoteEventEmitter } from 'src/util/webextensionRPC'
import type {
    AuthRemoteFunctionsInterface,
    AuthSettings,
    AuthBackendFunctions,
} from './types'
import type { JobDefinition } from 'src/job-scheduler/background/types'
import { isDev } from 'src/analytics/internal/constants'
import { setupRequestInterceptors } from 'src/authentication/background/redirect'
import type UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import type { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { SettingStore, BrowserSettingsStore } from 'src/util/settings'
import type { LimitedBrowserStorage } from 'src/util/tests/browser-storage'
import type { LocalExtensionSettings } from 'src/background-script/types'
import { dangerousPleaseBeSureDeleteAndRecreateDatabase } from 'src/storage/utils'

export class AuthBackground {
    authService: AuthService
    backendFunctions: AuthBackendFunctions
    settings: SettingStore<AuthSettings>
    subscriptionService: SubscriptionsService
    remoteFunctions: AuthRemoteFunctionsInterface
    scheduleJob: (job: JobDefinition) => void
    getUserManagement: () => Promise<UserStorage>

    private _userProfile?: Promise<User>

    constructor(
        public options: {
            authService: AuthService
            storageManager: StorageManager
            subscriptionService: SubscriptionsService
            localStorageArea: LimitedBrowserStorage
            backendFunctions: AuthBackendFunctions
            getUserManagement: () => Promise<UserStorage>
            scheduleJob: (job: JobDefinition) => void
            remoteEmitter: RemoteEventEmitter<'auth'>
            localExtSettingStore: SettingStore<LocalExtensionSettings>
        },
    ) {
        this.authService = options.authService
        this.backendFunctions = options.backendFunctions
        this.subscriptionService = options.subscriptionService
        this.scheduleJob = options.scheduleJob
        this.getUserManagement = options.getUserManagement
        this.settings = new BrowserSettingsStore<AuthSettings>(
            options.localStorageArea,
            {
                prefix: 'auth.',
            },
        )

        this.remoteFunctions = {
            refreshUserInfo: this.refreshUserInfo,
            getCurrentUser: () => this.authService.getCurrentUser(),
            runPostLoginLogic: this.handlePostLoginLogic,
            signOut: () => {
                delete this._userProfile
                this.authService.signOut()
            },
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
                return isAuthorizedForFeature({
                    claims: await this.subscriptionService.getCurrentUserClaims(),
                    settings: this.settings,
                    feature,
                })
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
            getUserByReference: async (reference) => {
                const userManagement = await this.getUserManagement()
                return userManagement.getUser(reference)
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
        await this.options.remoteEmitter.emit('onLoadingUser', true)
        await this.authService.refreshUserInfo()
        await this.options.remoteEmitter.emit('onLoadingUser', false)
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
            await this.options.remoteEmitter.emit('onLoadingUser', true)

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

            await this.options.remoteEmitter.emit('onLoadingUser', false)
            await this.options.remoteEmitter.emit(
                'onAuthStateChanged',
                userWithClaims,
            )
        })
    }

    private async ___wipeLocalUserData() {
        await dangerousPleaseBeSureDeleteAndRecreateDatabase(
            this.options.storageManager,
        )
        // TODO: Figure out which local storage data to delete
    }

    handlePostLoginLogic = async () => {
        const { localExtSettingStore } = this.options

        await this.refreshUserInfo()
        const prevUser = await localExtSettingStore.get('mostRecentUser')
        const nextUser = await this.authService.getCurrentUser()

        if (!nextUser) {
            return
        }

        const rememberUser = () =>
            localExtSettingStore.set('mostRecentUser', nextUser)

        if (!prevUser) {
            await rememberUser()
            return
        }

        if (prevUser.id !== nextUser.id) {
            await rememberUser()
            await this.___wipeLocalUserData()
            return
        }
    }
}
