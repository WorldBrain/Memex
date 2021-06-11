import type { UIEventHandler } from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    UILogic,
    loadInitial,
    executeUITask,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'

import { Event, State, Dependencies } from './types'

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class CloudOnboardingModalLogic extends UILogic<State, Event> {
    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({})
}
