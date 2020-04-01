import {
    UILogic,
    UIEvent,
    UIEventHandlers,
    IncomingUIEvent,
    UIMutation,
} from 'ui-logic-core'
import { SidebarUIControllerEventEmitter } from '../../../types'

export interface SidebarControllerState {
    state: 'visible' | 'hidden'
}

export type SidebarControllerEvents = UIEvent<{
    show: null
    hide: null
}>

export interface SidebarControllerDependencies {
    sidebarEvents: SidebarUIControllerEventEmitter
}

export class SidebarControllerLogic
    extends UILogic<SidebarControllerState, SidebarControllerEvents>
    implements
        UIEventHandlers<SidebarControllerState, SidebarControllerEvents> {
    constructor(private dependencies: SidebarControllerDependencies) {
        super()
    }

    getInitialState(): SidebarControllerState {
        return {
            state: 'visible',
        }
    }

    init() {}

    cleanup() {}

    show(
        incoming: IncomingUIEvent<
            SidebarControllerState,
            SidebarControllerEvents,
            'show'
        >,
    ): UIMutation<SidebarControllerState> {
        return { state: { $set: 'visible' } }
    }

    hide(): UIMutation<SidebarControllerState> {
        return { state: { $set: 'hidden' } }
    }
}
