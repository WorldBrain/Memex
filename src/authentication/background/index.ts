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
    getAuthorizedFeatures,
    isAuthorizedForFeature,
    getAuthorizedPlans,
} from './utils'
import { RemoteEventEmitter } from 'src/util/webextensionRPC'
import {
    AuthRemoteFunctionsInterface,
    AuthSettings,
    AuthBackendFunctions,
    EmailPasswordCredentials,
} from './types'
import * as Raven from 'src/util/raven'
import { isDev } from 'src/analytics/internal/constants'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import { User } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { SettingStore, BrowserSettingsStore } from 'src/util/settings'
import { LimitedBrowserStorage } from 'src/util/tests/browser-storage'
import {
    getAuth,
    sendPasswordResetEmail,
    updateEmail,
} from 'firebase/auth/web-extension'
import type { FirebaseError } from 'firebase/app'
import type { AuthServices } from 'src/services/types'
import { listenToWebAppMessage } from './auth-sync'
import type { Runtime } from 'webextension-polyfill'
import { validGeneratedLoginToken } from '@worldbrain/memex-common/lib/authentication/auth-sync'

export class AuthBackground {
    authService: AuthService
    backendFunctions: AuthBackendFunctions
    settings: SettingStore<AuthSettings>
    subscriptionService: SubscriptionsService
    remoteFunctions: AuthRemoteFunctionsInterface

    private _userProfile?: Promise<User>

    constructor(
        public options: {
            runtimeAPI: Runtime.Static
            authServices: AuthServices
            localStorageArea: LimitedBrowserStorage
            backendFunctions: AuthBackendFunctions
            remoteEmitter: RemoteEventEmitter<'auth'>
            userManagement: UserStorage
            getFCMRegistrationToken?: () => Promise<string>
        },
    ) {
        this.authService = options.authServices.auth
        this.backendFunctions = options.backendFunctions
        this.subscriptionService = options.authServices.subscriptions
        this.settings = new BrowserSettingsStore<AuthSettings>(
            options.localStorageArea,
            {
                prefix: 'auth.',
            },
        )

        this.remoteFunctions = {
            refreshUserInfo: this.refreshUserInfo,
            registerWithEmailPassword: this.registerWithEmailPassword,
            generateLoginToken: this.generateLoginToken,
            loginWithEmailPassword: this.loginWithEmailPassword,
            loginWithProvider: this.loginWithProvider,
            getCurrentUser: () => this.authService.getCurrentUser(),
            signOut: () => {
                delete this._userProfile
                this.authService.signOut()
            },
            sendPasswordResetEmailProcess: this.sendPasswordResetEmailProcess,
            changeEmailProcess: this.changeEmailProcess,
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
            isAuthorizedForFeature: async (feature: UserFeature) => {
                return isAuthorizedForFeature({
                    claims: await this.subscriptionService.getCurrentUserClaims(),
                    settings: this.settings,
                    feature,
                })
            },
            getUserProfile: async () => {
                const user = await this.authService.getCurrentUser()
                if (!user) {
                    return null
                }
                this._userProfile = this.options.userManagement.getUser({
                    type: 'user-reference',
                    id: user.id,
                })
                return this._userProfile
            },
            getUserByReference: async (reference) => {
                return this.options.userManagement.getUser(reference)
            },
            updateUserProfile: async (updates) => {
                const user = await this.authService.getCurrentUser()
                if (!user) {
                    return null
                }
                delete this._userProfile

                await this.options.userManagement.updateUser(
                    { type: 'user-reference', id: user.id },
                    {},
                    { displayName: updates.displayName },
                )
            },
        }

        listenToWebAppMessage(
            this.authService,
            options.runtimeAPI,
            options.localStorageArea,
        )
    }

    refreshUserInfo = async () => {
        await this.options.remoteEmitter.emit('onLoadingUser', true)
        await this.authService.refreshUserInfo()
        await this.options.remoteEmitter.emit('onLoadingUser', false)
    }

    sendPasswordResetEmailProcess = async (email: string) => {
        await sendPasswordResetEmail(getAuth(), email)
    }

    changeEmailProcess = async (email: string) => {
        await updateEmail(getAuth().currentUser, email)
    }

    registerRemoteEmitter() {
        this.authService.events.on('changed', async ({ user }) => {
            await this.options.remoteEmitter.emit('onLoadingUser', true)
            Raven.setUserContext(
                user ? { email: user.email, id: user.id } : undefined,
            )

            const userWithClaims = user
                ? {
                      ...user,
                      claims: await this.subscriptionService.getCurrentUserClaims(),
                  }
                : null

            if (isDev) {
                const claims = userWithClaims?.claims
                const userDebug = {
                    Expiry:
                        claims?.subscriptionExpiry &&
                        new Date(
                            claims?.subscriptionExpiry * 1000,
                        ).toLocaleString(),
                    Plans: getAuthorizedPlans(claims),
                }
                console['info'](`User changed:`, userDebug)
            }

            // TODO: Find out why these sometimes won't resolve/get stuck
            this.options.remoteEmitter.emit('onLoadingUser', false)
            this.options.remoteEmitter.emit(
                'onAuthStateChanged',
                userWithClaims,
            )

            if (this.options.getFCMRegistrationToken != null && user != null) {
                const token = await this.options.getFCMRegistrationToken()
                await this.options.userManagement.addUserFCMRegistrationToken(
                    {
                        type: 'user-reference',
                        id: user.id,
                    },
                    token,
                )
            }
        })
    }

    generateLoginToken = async () => {
        const tokenObj = await this.authService.generateLoginToken()
        const loginToken = tokenObj.token
        if (!validGeneratedLoginToken(loginToken)) {
            return
        }
        return loginToken
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
            await this.options.userManagement.updateUser(
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
        } catch (err) {
            const firebaseError: FirebaseError = err
            if (firebaseError.code === 'auth/invalid-email') {
                return { result: { status: 'error', reason: 'invalid-email' } }
            }
            if (firebaseError.code === 'auth/user-not-found') {
                return { result: { status: 'error', reason: 'user-not-found' } }
            }
            if (firebaseError.code === 'auth/wrong-password') {
                return { result: { status: 'error', reason: 'wrong-password' } }
            }
            console.error(err)
            return { result: { status: 'error', reason: 'unknown' } }
        }
    }

    loginWithProvider: AuthRemoteFunctionsInterface['loginWithProvider'] = async (
        provider,
    ) => {
        try {
            await this.authService.loginWithProvider(provider)
            return { result: { status: 'authenticated' } }
        } catch (err) {
            console.error(err)
            return { result: { status: 'error', reason: 'unknown' } }
        }
    }
}
