import type { Storage } from 'webextension-polyfill-ts'
import type { UIEvent } from 'ui-logic-core'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'

export interface Dependencies {
    localStorage: Storage.LocalStorageArea
    authBG: AuthRemoteFunctionsInterface
    navToDashboard: () => void
}

export interface State {
    loadState: UITaskState
    step: 'tutorial' | 'sync'
    shouldShowLogin: boolean
}

export type Event = UIEvent<{
    finishOnboarding: null
    goToSyncStep: null
    onUserLogIn: null
}>
