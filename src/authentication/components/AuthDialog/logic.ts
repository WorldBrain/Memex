import {
    UILogic,
    executeUITask,
    UIEventHandler,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { Dependencies, State, Event, AuthDialogMode } from './types'
import { EmailPasswordCredentials } from 'src/authentication/background/types'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class Logic extends UILogic<State, Event> {
    syncPromise: Promise<any>
    action?: 'login' | 'register'

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

    toggleMode: EventHandler<'toggleMode'> = async ({ previousState }) => {
        if (previousState.mode !== 'signup' && previousState.mode !== 'login') {
            return
        }

        const mode: AuthDialogMode =
            previousState.mode === 'signup' ? 'login' : 'signup'
        this.emitMutation({
            mode: {
                $set: mode,
            },
        })
        this.dependencies.onModeChange?.({ mode })
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
                }
                this.dependencies.onAuth?.({ reason: 'register' })
            } else if (previousState.mode === 'login') {
                const { result } = await auth.loginWithEmailPassword(
                    credentials,
                )
                if (result.status === 'error') {
                    this.emitMutation({ error: { $set: result.reason } })
                    return
                }
                this.dependencies.onAuth?.({ reason: 'login' })
            }
        })
    }
}
