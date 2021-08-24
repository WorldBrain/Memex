import type { UIEvent } from 'ui-logic-core'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'

export interface Dependencies {
    authBG: AuthRemoteFunctionsInterface
    navToOverview: () => void
}

export interface State {
    loadState: UITaskState
    syncState: UITaskState
    step: 'tutorial' | 'sync'
    shouldShowLogin: boolean
}

export type Event = UIEvent<{
    goToSyncStep: null
    onUserLogIn: null
}>
