import {
    UILogic,
    loadInitial,
    executeUITask,
    UIEventHandler,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { Dependencies, State, Event } from './types'
import delay from 'src/util/delay'
import {
    AuthResult,
    EmailPasswordCredentials,
} from 'src/authentication/background/types'
import { GUIDED_ONBOARDING_URL } from '../../constants'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class Logic extends UILogic<State, Event> {
    syncPromise: Promise<any>
    isExistingUser = false
    action?: 'login' | 'register'

    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        step: 'tutorial',
        loadState: 'pristine',
        syncState: 'pristine',
        shouldShowLogin: true,
        newSignUp: false,
        mode: 'signup',
        email: '',
        password: '',
        displayName: '',
        saveState: 'pristine',
        passwordMatch: false,
        passwordConfirm: '',
    })

    async init() {
        const { authBG } = this.dependencies

        this.emitMutation({
            mode: { $set: 'signup' },
        })

        await loadInitial(this, async () => {
            const user = await authBG.getCurrentUser()
            if (user != null) {
                this.isExistingUser = true
                await this._onUserLogIn(false)
            }
        })
    }

    private async _onUserLogIn(newSignUp: boolean) {
        this.emitMutation({
            shouldShowLogin: { $set: false },
            newSignUp: { $set: newSignUp },
        })

        if (!this.isExistingUser) {
            this.syncPromise = executeUITask(this, 'syncState', async () =>
                this.dependencies.personalCloudBG.enableCloudSyncForNewInstall(),
            )
        }
    }

    onUserLogIn: EventHandler<'onUserLogIn'> = async ({ event }) => {
        await this._onUserLogIn(!!event.newSignUp)
    }

    goToSyncStep: EventHandler<'goToSyncStep'> = async ({ previousState }) => {
        if (!this.isExistingUser && !previousState.newSignUp) {
            this.emitMutation({ step: { $set: 'sync' } })

            await (previousState.syncState === 'success'
                ? delay(3000)
                : this.syncPromise)
        }
        this.dependencies.navToDashboard()
    }

    goToGuidedTutorial: EventHandler<'goToGuidedTutorial'> = ({}) => {
        this.dependencies.navToGuidedTutorial()
    }

    finishOnboarding: EventHandler<'finishOnboarding'> = ({}) => {
        this.dependencies.navToDashboard()
    }

    toggleMode: EventHandler<'toggleMode'> = async ({ previousState }) => {
        if (previousState.mode !== 'signup' && previousState.mode !== 'login') {
            return
        }

        this.emitMutation({
            mode: {
                $set: previousState.mode === 'signup' ? 'login' : 'signup',
            },
        })
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
                // if (result.status === 'error') {
                //     this.emitMutation({ error: { $set: result.reason } })
                // } else {
                //     this.emitMutation({ mode: { $set: 'profile' } })
                // }
            } else if (previousState.mode === 'login') {
                const { result } = await auth.loginWithEmailPassword(
                    credentials,
                )
                // if (result.status === 'error') {
                //     this.emitMutation({ error: { $set: result.reason } })
                //     return
                // }
                // if ((await auth.getCurrentUser())?.displayName) {
                //     this._result({ status: 'authenticated' })
                // } else {
                //     this.emitMutation({ mode: { $set: 'profile' } })
                // }
            }
        })
    }
}
