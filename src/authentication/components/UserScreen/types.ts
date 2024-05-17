import type { UIEvent } from 'ui-logic-core'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'
import type { AuthDialogMode } from 'src/authentication/components/AuthDialog/types'
import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { Browser } from 'webextension-polyfill'

export interface Dependencies {
    authBG: AuthRemoteFunctionsInterface
    personalCloudBG: PersonalCloudRemoteInterface
    navToDashboard: () => void
    navToGuidedTutorial: () => void
    browserAPIs: Browser
}

export interface State {
    saveState: UITaskState
    loadState: UITaskState
    syncState: UITaskState
    authDialogMode?: AuthDialogMode
    step: 'tutorial' | 'sync'
    shouldShowLogin: boolean
    newSignUp: boolean
    mode: 'signup' | 'login'
    email: string
    password: string
    passwordConfirm: string
    displayName: string
    passwordMatch: boolean
    currentUser: AuthenticatedUser
    passwordResetSent: boolean
    pageLimit: string
    AILimit: string
    subscriptionStatus: string
    subscriptionStatusLoading: UITaskState
    loadQRCode: UITaskState
    loginToken: string
    generateTokenDisplay: string
    systemSelectMenuState: boolean
    copyToClipBoardState: UITaskState
    isStagingEnv: boolean
}

export type Event = UIEvent<{
    finishOnboarding: null
    goToSyncStep: null
    goToGuidedTutorial: null
    onUserLogIn: { newSignUp?: boolean }
    setAuthDialogMode: { mode: AuthDialogMode }
    getCurrentUser: { currentUser: AuthenticatedUser }
    sendPasswordReset: null
    generateLoginToken: { system: string }
    setSubscriptionStatus: {
        email: string
    }
    toggleGenerateTokenSystemSelectMenu: null
    copyCodeToClipboard: null
}>
