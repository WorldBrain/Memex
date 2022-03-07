import {
    AuthenticatedUser,
    AuthService,
    RegistrationResult,
    LoginResult,
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
import { RemoteEventEmitter } from 'src/util/webextensionRPC'
import {
    AuthRemoteEvents,
    AuthRemoteFunctionsInterface,
    AuthSettings,
    AuthBackendFunctions,
    EmailPasswordCredentials,
} from './types'
import { JobDefinition } from 'src/job-scheduler/background/types'
import { isDev } from 'src/analytics/internal/constants'
import { setupRequestInterceptors } from 'src/authentication/background/redirect'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { SettingStore, BrowserSettingsStore } from 'src/util/settings'
import { LimitedBrowserStorage } from 'src/util/tests/browser-storage'
import firebase from 'firebase'

export class AuthBackground {
    authService: AuthService
    backendFunctions: AuthBackendFunctions
    settings: SettingStore<AuthSettings>
    subscriptionService: SubscriptionsService
    remoteFunctions: AuthRemoteFunctionsInterface
    scheduleJob: (job: JobDefinition) => void
    getUserManagement: () => Promise<UserStorage>
    private _firebase: typeof firebase

    private _userProfile?: Promise<User>

    constructor(
        public options: {
            authService: AuthService
            subscriptionService: SubscriptionsService
            localStorageArea: LimitedBrowserStorage
            backendFunctions: AuthBackendFunctions
            getUserManagement: () => Promise<UserStorage>
            scheduleJob: (job: JobDefinition) => void
            remoteEmitter: RemoteEventEmitter<'auth'>
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
            registerWithEmailPassword: this.registerWithEmailPassword,
            loginWithEmailPassword: this.loginWithEmailPassword,
            getCurrentUser: () => this.authService.getCurrentUser(),
            signOut: () => {
                delete this._userProfile
                this.authService.signOut()
            },
            sendPasswordResetEmailProcess: this.sendPasswordResetEmailProcess,
            changeEmailProcess: this.changeEmailProcess,
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

    sendPasswordResetEmailProcess = async (email) => {
        return firebase.auth().sendPasswordResetEmail(email)
    }

    changeEmailProcess = async (email) => {
        return firebase.auth().currentUser.updateEmail(email)
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

    registerWithEmailPassword = async (
        options: EmailPasswordCredentials,
    ): Promise<{ result: RegistrationResult }> => {
        const { result } = await this.authService.registerWithEmailAndPassword(
            options.email,
            options.password,
        )
        if (result.status !== 'registered-and-authenticated') {
            return { result }
        }
        const user = await this.authService.getCurrentUser()
        if (!user) {
            const message = `User registered successfuly, but didn't detect authenticated user after`
            console.error(`Error while registering user`, message)
            return {
                result: {
                    status: 'error',
                    reason: 'unknown',
                    internalReason: message,
                },
            }
        }

        if (options.displayName) {
            const userManagement = await this.getUserManagement()
            await userManagement.updateUser(
                { type: 'user-reference', id: user.id },
                { knownStatus: 'new' },
                { displayName: options.displayName },
            )
        }
        return { result: { status: 'registered-and-authenticated' } }
    }

    loginWithEmailPassword = async (
        options: EmailPasswordCredentials,
    ): Promise<{ result: LoginResult }> => {
        try {
            await this.authService.loginWithEmailAndPassword(
                options.email,
                options.password,
            )
            return { result: { status: 'authenticated' } }
        } catch (e) {
            const firebaseError: firebase.FirebaseError = e
            if (firebaseError.code === 'auth/invalid-email') {
                return { result: { status: 'error', reason: 'invalid-email' } }
            }
            if (firebaseError.code === 'auth/user-not-found') {
                return { result: { status: 'error', reason: 'user-not-found' } }
            }
            if (firebaseError.code === 'auth/wrong-password') {
                return { result: { status: 'error', reason: 'wrong-password' } }
            }
            return { result: { status: 'error', reason: 'unknown' } }
        }
    }
}
