import {
    UILogic,
    UIEventHandler,
    loadInitial,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import { STORAGE_KEYS as CLOUD_STORAGE_KEYS } from 'src/personal-cloud/constants'
import type { Dependencies, State, Event } from './types'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class Logic extends UILogic<State, Event> {
    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        step: 'tutorial',
        loadState: 'pristine',
        shouldShowLogin: true,
    })

    async init() {
        const { authBG } = this.dependencies

        await loadInitial(this, async () => {
            const user = await authBG.getCurrentUser()
            if (user != null) {
                await this._onUserLogIn()
            }
        })
    }

    private async _onUserLogIn() {
        this.emitMutation({ shouldShowLogin: { $set: false } })

        await this.dependencies.localStorage.set({
            [CLOUD_STORAGE_KEYS.isEnabled]: true,
        })
    }

    onUserLogIn: EventHandler<'onUserLogIn'> = async ({}) => {
        await this._onUserLogIn()
    }

    goToSyncStep: EventHandler<'goToSyncStep'> = ({}) => {
        this.emitMutation({ step: { $set: 'sync' } })
    }

    finishOnboarding: EventHandler<'finishOnboarding'> = ({}) => {
        this.dependencies.navToDashboard()
    }
}
