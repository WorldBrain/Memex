import { UILogic, UIEvent, IncomingUIEvent, UIMutation } from 'ui-logic-core'
import { VISIT_DELAY_RANGE } from 'src/options/settings/constants'

export interface State {
    visitDelay: number
    currentStep: number
    isTooltipEnabled: boolean
    isSidebarEnabled: boolean
    areStubsEnabled: boolean
    areVisitsEnabled: boolean
    areShortcutsEnabled: boolean
    areBookmarksEnabled: boolean
    areAnnotationsEnabled: boolean
    areScreenshotsEnabled: boolean
    areCollectionsEnabled: boolean
    showSearchSettings: boolean
}

export type Event = UIEvent<{
    setStep: { step: number }
    setVisitDelay: { delay: number }
    setTooltipEnabled: { enabled: boolean }
    setSidebarEnabled: { enabled: boolean }
    setShortcutsEnabled: { enabled: boolean }
    setSearchSettingsShown: { shown: boolean }
    setStubsEnabled: { enabled: boolean }
    setVisitsEnabled: { enabled: boolean }
    setBookmarksEnabled: { enabled: boolean }
    setAnnotationsEnabled: { enabled: boolean }
    setScreenshotsEnabled: { enabled: boolean }
    setCollectionsEnabled: { enabled: boolean }
}>

export default class Logic extends UILogic<State, Event> {
    getInitialState(): State {
        return {
            visitDelay: VISIT_DELAY_RANGE.DEF,
            currentStep: 0,
            isTooltipEnabled: true,
            isSidebarEnabled: true,
            areShortcutsEnabled: true,
            areStubsEnabled: true,
            areVisitsEnabled: true,
            areBookmarksEnabled: true,
            areAnnotationsEnabled: true,
            areScreenshotsEnabled: false,
            areCollectionsEnabled: true,
            showSearchSettings: false,
        }
    }

    setStep(
        incoming: IncomingUIEvent<State, Event, 'setStep'>,
    ): UIMutation<State> {
        return { currentStep: { $set: incoming.event.step } }
    }

    setVisitDelay(
        incoming: IncomingUIEvent<State, Event, 'setVisitDelay'>,
    ): UIMutation<State> {
        return { visitDelay: { $set: incoming.event.delay } }
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

    setShortcutsEnabled(
        incoming: IncomingUIEvent<State, Event, 'setShortcutsEnabled'>,
    ): UIMutation<State> {
        return { areShortcutsEnabled: { $set: incoming.event.enabled } }
    }

    setSearchSettingsShown(
        incoming: IncomingUIEvent<State, Event, 'setSearchSettingsShown'>,
    ): UIMutation<State> {
        return { showSearchSettings: { $set: incoming.event.shown } }
    }

    setStubsEnabled(
        incoming: IncomingUIEvent<State, Event, 'setStubsEnabled'>,
    ): UIMutation<State> {
        return { areStubsEnabled: { $set: incoming.event.enabled } }
    }

    setVisitsEnabled(
        incoming: IncomingUIEvent<State, Event, 'setVisitsEnabled'>,
    ): UIMutation<State> {
        return { areVisitsEnabled: { $set: incoming.event.enabled } }
    }

    setBookmarksEnabled(
        incoming: IncomingUIEvent<State, Event, 'setBookmarksEnabled'>,
    ): UIMutation<State> {
        return { areBookmarksEnabled: { $set: incoming.event.enabled } }
    }

    setAnnotationsEnabled(
        incoming: IncomingUIEvent<State, Event, 'setAnnotationsEnabled'>,
    ): UIMutation<State> {
        return { areAnnotationsEnabled: { $set: incoming.event.enabled } }
    }

    setScreenshotsEnabled(
        incoming: IncomingUIEvent<State, Event, 'setScreenshotsEnabled'>,
    ): UIMutation<State> {
        return { areScreenshotsEnabled: { $set: incoming.event.enabled } }
    }

    setCollectionsEnabled(
        incoming: IncomingUIEvent<State, Event, 'setCollectionsEnabled'>,
    ): UIMutation<State> {
        return { areCollectionsEnabled: { $set: incoming.event.enabled } }
    }
}
