import {
    UILogic,
    UIEvent,
    IncomingUIEvent,
    UIEventHandler,
    UIMutation,
} from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'
import { RibbonControllerEventEmitter } from '../../../types'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { RibbonController } from 'src/in-page-ui/ribbon'
import { RibbonContainerDependencies } from '../ribbon/types'
import {
    InPageUIInterface,
    InPageUIState,
} from 'src/in-page-ui/shared-state/types'
import { InPageUI } from 'src/in-page-ui/shared-state'

export interface RibbonHolderState {
    state: 'visible' | 'hidden'
    isSidebarOpen: boolean
}

export type RibbonHolderEvents = UIEvent<{
    show: null
    hide: null
}>

export interface RibbonHolderDependencies {
    inPageUI: InPageUIInterface
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
>
// implements UIEventHandlers<RibbonHolderState, RibbonHolderEvents>
{
    constructor(private dependencies: RibbonHolderDependencies) {
        super()
    }

    getInitialState(): RibbonHolderState {
        return {
            state: this.dependencies.inPageUI.state.ribbon
                ? 'visible'
                : 'hidden',
            isSidebarOpen: this.dependencies.inPageUI.state.sidebar,
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

    _handleUIStateChange = (event: { newState: InPageUIState }) => {
        this.emitMutation({ isSidebarOpen: { $set: event.newState.sidebar } })
    }
}
