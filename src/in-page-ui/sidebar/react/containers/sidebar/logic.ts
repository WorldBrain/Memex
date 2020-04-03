import {
    UILogic,
    UIEvent,
    UIEventHandlers,
    IncomingUIEvent,
    UIMutation,
} from 'ui-logic-core'
import { SidebarControllerEventEmitter } from '../../../types'

export interface SidebarContainerState {
    state: 'visible' | 'hidden'
}

export type SidebarContainerEvents = UIEvent<{
    show: null
    hide: null
}>

export interface SidebarContainerDependencies {
    sidebarEvents: SidebarControllerEventEmitter
}

export class SidebarContainerLogic
    extends UILogic<SidebarContainerState, SidebarContainerEvents>
    implements UIEventHandlers<SidebarContainerState, SidebarContainerEvents> {
    constructor(private dependencies: SidebarContainerDependencies) {
        super()
    }

    getInitialState(): SidebarContainerState {
        return {
            state: 'visible',
        }
    }

    init() {}

    cleanup() {}

    show(
        incoming: IncomingUIEvent<
            SidebarContainerState,
            SidebarContainerEvents,
            'show'
        >,
    ): UIMutation<SidebarContainerState> {
        return { state: { $set: 'visible' } }
    }

    hide(): UIMutation<SidebarContainerState> {
        return { state: { $set: 'hidden' } }
    }
}
