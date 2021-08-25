import type { UIEvent } from 'ui-logic-core'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'

export interface Dependencies {
    personalCloudBG: PersonalCloudRemoteInterface
    authBG: AuthRemoteFunctionsInterface
    navToDashboard: () => void
}

export interface State {
    loadState: UITaskState
    syncState: UITaskState
    step: 'tutorial' | 'sync'
    shouldShowLogin: boolean
}

export type Event = UIEvent<{
    finishOnboarding: null
    goToSyncStep: null
    onUserLogIn: null
}>
