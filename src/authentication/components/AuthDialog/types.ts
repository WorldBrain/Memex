import type { UIEvent } from 'ui-logic-core'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { AuthProviderType } from '@worldbrain/memex-common/lib/authentication/types'

export interface Dependencies {
    authBG: AuthRemoteFunctionsInterface
    onModeChange?(event: {
        mode: AuthDialogMode
        setSaveState?: UITaskState
    }): void
    onAuth?(event: { reason: 'login' | 'register' }): void
}

export type AuthDialogMode =
    | 'signup'
    | 'login'
    | 'resetPassword'
    | 'ConfirmResetPassword'

export interface State {
    saveState: UITaskState
    loadState: UITaskState
    mode: AuthDialogMode
    error?: string
    email: string
    password: string
    passwordConfirm: string
    displayName: string
    passwordMatch: boolean
}

export type Event = UIEvent<{
    editEmail: { value: string }
    passwordMatch: { value: boolean }
    editPassword: { value: string }
    editPasswordConfirm: { value: string }
    emailPasswordConfirm: null
    socialLogin: { provider: AuthProviderType }
    toggleMode: { mode: AuthDialogMode }
    editDisplayName: { value: string }
    passwordReset: null
    passwordResetSwitch: null
    passwordResetConfirm: null
}>
