import { UILogic, UIEvent, IncomingUIEvent, UIMutation } from 'ui-logic-core'

export interface State {
    currentStep: number
    isTooltipEnabled: boolean
    isSidebarEnabled: boolean
    showSearchSettings: boolean
}

export type Event = UIEvent<{
    setStep: { step: number }
    setTooltipEnabled: { enabled: boolean }
    setSidebarEnabled: { enabled: boolean }
    setSearchSettingsShown: { shown: boolean }
}>

export default class Logic extends UILogic<State, Event> {
    getInitialState(): State {
        return {
            currentStep: 0,
            isSidebarEnabled: true,
            isTooltipEnabled: true,
            showSearchSettings: false,
        }
    }

    setStep(
        incoming: IncomingUIEvent<State, Event, 'setStep'>,
    ): UIMutation<State> {
        return { currentStep: { $set: incoming.event.step } }
    }

    setTooltipEnabled(
        incoming: IncomingUIEvent<State, Event, 'setTooltipEnabled'>,
    ): UIMutation<State> {
        return { isTooltipEnabled: { $set: incoming.event.enabled } }
    }

    setSidebarEnabled(
        incoming: IncomingUIEvent<State, Event, 'setSidebarEnabled'>,
    ): UIMutation<State> {
        return { isSidebarEnabled: { $set: incoming.event.enabled } }
    }

    setSearchSettingsShown(
        incoming: IncomingUIEvent<State, Event, 'setSearchSettingsShown'>,
    ): UIMutation<State> {
        return { showSearchSettings: { $set: incoming.event.shown } }
    }
}
