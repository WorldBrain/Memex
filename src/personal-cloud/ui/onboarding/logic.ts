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

    async init() {
        const { authBG } = this.dependencies
        await loadInitial(this, async () => {
            const user = await authBG.getCurrentUser()

            if (user) {
                this.emitMutation({ currentUser: { $set: user } })
            }
        })
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        currentUser: null,
        tier2PaymentPeriod: 'monthly',
    })

    setTier2PaymentPeriod: EventHandler<'setTier2PaymentPeriod'> = ({
        event,
    }) => {
        this.emitMutation({ tier2PaymentPeriod: { $set: event.period } })
    }

    selectPlan: EventHandler<'selectPlan'> = ({ event }) => {
        console.log('selected plan:', event.tier)
    }
}
