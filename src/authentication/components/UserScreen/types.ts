import type { UIEvent } from 'ui-logic-core'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'
import type { AuthDialogMode } from 'src/authentication/components/AuthDialog/types'
import { AuthBackground } from 'src/authentication/background'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'

export interface Dependencies {
    authBG: AuthRemoteFunctionsInterface
    personalCloudBG: PersonalCloudRemoteInterface
    navToDashboard: () => void
    navToGuidedTutorial: () => void
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
}

export type Event = UIEvent<{
    finishOnboarding: null
    goToSyncStep: null
    goToGuidedTutorial: null
    onUserLogIn: { newSignUp?: boolean }
    setAuthDialogMode: { mode: AuthDialogMode }
    getCurrentUser: { currentUser: AuthenticatedUser }
}>
