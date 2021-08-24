import {
    UILogic,
    UIEventHandler,
    executeUITask,
    loadInitial,
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

    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        step: 'tutorial',
        loadState: 'pristine',
        syncState: 'pristine',
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

        this.syncPromise = executeUITask(this, 'syncState', async () => {
            await delay(2000)
        })
    }

    onUserLogIn: EventHandler<'onUserLogIn'> = async ({}) => {
        await this._onUserLogIn()
    }

    goToSyncStep: EventHandler<'goToSyncStep'> = ({}) => {
        this.emitMutation({ step: { $set: 'sync' } })
    }
}
