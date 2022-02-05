import {
    UILogic,
    loadInitial,
    executeUITask,
    UIEventHandler,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import type { Dependencies, State, Event } from './types'
import delay from 'src/util/delay'

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
        currentUser: null,
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

    getCurrentUser: EventHandler<'getCurrentUser'> = ({ event }) => {
        this.emitMutation({
            currentUser: { $set: event.currentUser },
        })
    }

    onUserLogIn: EventHandler<'onUserLogIn'> = async ({ event }) => {
        await this._onUserLogIn(!!event.newSignUp)
    }

    setAuthDialogMode: EventHandler<'setAuthDialogMode'> = ({ event }) => {
        return { authDialogMode: { $set: event.mode } }
    }
}
