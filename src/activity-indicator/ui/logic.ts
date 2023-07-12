import { UILogic, UIEventHandler, UIEvent } from 'ui-logic-core'
import type { ActivityIndicatorInterface } from '../background'

export interface Dependencies {
    activityIndicatorBG: Pick<
        ActivityIndicatorInterface,
        'checkActivityStatus' | 'markActivitiesAsSeen'
    >
    clickedOn?: () => void
    // openFeedUrl: () => void
}

export interface State {
    isShown: boolean
    hasFeedActivity: boolean
}

export type Events = UIEvent<{
    clickFeedEntry: null
}>

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export default class Logic extends UILogic<State, Events> {
    constructor(private dependencies: Dependencies) {
        super()
    }

    getInitialState(): State {
        return {
            isShown: true,
            hasFeedActivity: false,
        }
    }

    ///// IMPORTANT! THIS CODE IS DUPLICATED IN DASHBOARD-REFACTOR/LOGIC
    ///// FOR THE INSTANCE OF THE SIDEBAR, DON'T FORGET TO UPDATE IT TOO!

    init: EventHandler<'init'> = async () => {
        const activityStatus = await this.dependencies.activityIndicatorBG.checkActivityStatus()

        this.emitMutation({
            hasFeedActivity: { $set: activityStatus === 'has-unseen' },
        })
    }

    clickFeedEntry: EventHandler<'clickFeedEntry'> = async ({
        previousState,
    }) => {
        this.emitMutation({ hasFeedActivity: { $set: false } })
        await this.dependencies.activityIndicatorBG.markActivitiesAsSeen()
    }
}
