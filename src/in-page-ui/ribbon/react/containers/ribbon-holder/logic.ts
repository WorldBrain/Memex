import { UILogic, UIEvent, UIEventHandler } from 'ui-logic-core'
import { RibbonContainerDependencies } from '../ribbon/types'
import {
    SharedInPageUIInterface,
    InPageUIComponentShowState,
} from 'src/in-page-ui/shared-state/types'

export interface RibbonHolderState {
    state: 'visible' | 'hidden'
    isSidebarOpen: boolean
}

export type RibbonHolderEvents = UIEvent<{
    show: null
    hide: null
}>

export interface RibbonHolderDependencies {
    inPageUI: SharedInPageUIInterface
    containerDependencies: RibbonContainerDependencies
}

type EventHandler<EventName extends keyof RibbonHolderEvents> = UIEventHandler<
    RibbonHolderState,
    RibbonHolderEvents,
    EventName
>

export class RibbonHolderLogic extends UILogic<
    RibbonHolderState,
    RibbonHolderEvents
> {
    constructor(private dependencies: RibbonHolderDependencies) {
        super()
    }

    getInitialState(): RibbonHolderState {
        return {
            state: this.dependencies.inPageUI.componentsShown.ribbon
                ? 'visible'
                : 'hidden',
            isSidebarOpen: this.dependencies.inPageUI.componentsShown.sidebar,
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        this.dependencies.inPageUI.events.on(
            'stateChanged',
            this._handleUIStateChange,
        )

        // await loadInitial<RibbonHolderState>(this, async () => {
        //     await this._maybeLoad(previousState, {})
        // })
    }

    cleanup() {
        this.dependencies.inPageUI.events.removeListener(
            'stateChanged',
            this._handleUIStateChange,
        )
    }

    show: EventHandler<'show'> = () => {
        return { state: { $set: 'visible' } }
    }

    hide: EventHandler<'hide'> = () => {
        return { state: { $set: 'hidden' } }
    }

    _handleUIStateChange = (event: {
        newState: InPageUIComponentShowState
    }) => {
        this.emitMutation({ isSidebarOpen: { $set: event.newState.sidebar } })
    }
}
