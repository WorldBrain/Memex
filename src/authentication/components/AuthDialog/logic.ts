import {
    UILogic,
    executeUITask,
    UIEventHandler,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { Dependencies, State, Event, AuthDialogMode } from './types'
import type { EmailPasswordCredentials } from 'src/authentication/background/types'
import { checkStripePlan } from '@worldbrain/memex-common/lib/subscriptions/storage'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class Logic extends UILogic<State, Event> {
    syncPromise: Promise<any>
    action?: 'login' | 'register' | 'resetPassword'

    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        saveState: 'pristine',
        mode: 'signup',
        displayName: '',
        email: '',
        password: '',
        passwordConfirm: '',
        passwordMatch: true,
    })

    async init() {
        this.emitMutation({
            mode: { $set: 'signup' },
        })
        this.dependencies.onModeChange?.({ mode: 'signup' })
    }

    toggleMode: EventHandler<'toggleMode'> = ({ event }) => {
        this.emitMutation({
            mode: {
                $set: event.mode,
            },
        })
        this.dependencies.onModeChange?.({ mode: event.mode })
    }

    editEmail: EventHandler<'editEmail'> = ({ event }) => {
        return { email: { $set: event.value } }
    }

    editPassword: EventHandler<'editPassword'> = ({ event }) => {
        return { password: { $set: event.value } }
    }

    editPasswordConfirm: EventHandler<'editPasswordConfirm'> = ({ event }) => {
        return { passwordConfirm: { $set: event.value } }
    }

    passwordMatch: EventHandler<'passwordMatch'> = ({ event }) => {
        return { passwordMatch: { $set: event.value } }
    }

    passwordResetSwitch: EventHandler<'passwordResetSwitch'> = () => {
        this.emitMutation({
            mode: {
                $set: 'resetPassword',
            },
        })
        this.dependencies.onModeChange?.({ mode: 'resetPassword' })
    }

    passwordResetConfirm: EventHandler<'passwordResetConfirm'> = () => {
        this.emitMutation({
            mode: {
                $set: 'ConfirmResetPassword',
            },
        })
        this.dependencies.onModeChange?.({ mode: 'ConfirmResetPassword' })
    }

    passwordReset: EventHandler<'passwordReset'> = async ({
        event,
        previousState,
    }) => {
        const auth = this.dependencies.authBG
        await auth.sendPasswordResetEmailProcess(previousState.email)
    }

    editDisplayName: EventHandler<'editDisplayName'> = ({ event }) => {
        return { displayName: { $set: event.value } }
    }

    emailPasswordConfirm: EventHandler<'emailPasswordConfirm'> = async ({
        previousState,
    }) => {
        if (!previousState.email || !previousState.password) {
            return
        }
        if (
            previousState.mode === 'signup' &&
            (!previousState.displayName ||
                previousState.password !== previousState.passwordConfirm)
        ) {
            return
        }

        const credentials: EmailPasswordCredentials = {
            email: previousState.email,
            password: previousState.password,
            displayName: previousState.displayName,
        }
        await executeUITask<State>(this, 'saveState', async () => {
            const auth = this.dependencies.authBG
            this.action = previousState.mode as 'login' | 'register'
            if (previousState.mode === 'signup') {
                const { result } = await auth.registerWithEmailPassword(
                    credentials,
                )

                if (result.status === 'error') {
                    this.emitMutation({ error: { $set: result.reason } })
                    return
                } else {
                    this.dependencies.onAuth?.({ reason: 'register' })
                }
            } else if (previousState.mode === 'login') {
                this.dependencies.onModeChange?.({
                    mode: 'login',
                    setSaveState: 'running',
                })
                const { result } = await auth.loginWithEmailPassword(
                    credentials,
                )
                if (result.status === 'error') {
                    this.emitMutation({ error: { $set: result.reason } })
                    return
                } else {
                    this.dependencies.onAuth?.({ reason: 'login' })
                    await checkStripePlan(
                        credentials.email,
                        this.dependencies.browserAPIs,
                    )
                }
            }
        })
    }

    socialLogin: EventHandler<'socialLogin'> = async ({
        previousState,
        event,
    }) => {
        const { result } = await this.dependencies.authBG.loginWithProvider(
            event.provider,
        )
        if (result.status === 'error') {
            this.emitMutation({ error: { $set: result.reason } })
        } else {
            this.dependencies.onAuth?.({ reason: 'login' })
            const currentUser = await this.dependencies.authBG.getCurrentUser()
            const email = currentUser.email
            await checkStripePlan(email, this.dependencies.browserAPIs)
        }
    }
}
