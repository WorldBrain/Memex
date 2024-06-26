import { UILogic, UIEvent, UIEventHandler } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'

import { loadInitial } from 'src/util/ui-logic'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { READ_STORAGE_FLAG } from './constants'

export interface LogicDeps {
    getStorage: typeof getLocalStorage
    setStorage: typeof setLocalStorage
    getFeatureBaseToken: () => Promise<string>
}

export interface State {
    isVisible: boolean
    loadState: TaskState
    featureBaseToken: string
}

export type Event = UIEvent<{
    hide: null
}>

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export class Logic extends UILogic<State, Event> {
    constructor(private deps: LogicDeps) {
        super()
    }

    getInitialState(): State {
        return {
            isVisible: false,
            loadState: 'pristine',
            featureBaseToken: null,
        }
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial<State>(this, async () => {
            const isRead = await this.deps.getStorage(READ_STORAGE_FLAG, false)
            if (!isRead) {
                const featureBaseToken = await this.deps.getFeatureBaseToken()
                this.emitMutation({
                    featureBaseToken: { $set: featureBaseToken },
                })
            }

            this.emitMutation({ isVisible: { $set: !isRead } })
        })
    }

    hide: EventHandler<'hide'> = async () => {
        this.emitMutation({ isVisible: { $set: false } })
        await this.deps.setStorage(READ_STORAGE_FLAG, true)
    }
}
