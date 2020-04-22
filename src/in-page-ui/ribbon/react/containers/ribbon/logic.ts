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
import { InPageUI } from 'src/in-page-ui/shared-state'
import { RibbonContainerDependencies } from './types'

export interface RibbonContainerState {
    state: 'visible' | 'hidden'
}

export type RibbonContainerEvents = UIEvent<{
    show: null
    hide: null
}>

export interface RibbonContainerOptions extends RibbonContainerDependencies {
    inPageUI: InPageUI
    ribbonController: RibbonController
}

type EventHandler<
    EventName extends keyof RibbonContainerEvents
> = UIEventHandler<RibbonContainerState, RibbonContainerEvents, EventName>

export class RibbonContainerLogic extends UILogic<
    RibbonContainerState,
    RibbonContainerEvents
>
// implements UIEventHandlers<RibbonContainerState, RibbonContainerEvents>
{
    constructor(private dependencies: RibbonContainerOptions) {
        super()
    }

    getInitialState(): RibbonContainerState {
        return {
            state: this.dependencies.inPageUI.state.ribbon
                ? 'visible'
                : 'hidden',
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        // await loadInitial<RibbonContainerState>(this, async () => {
        //     await this._maybeLoad(previousState, {})
        // })
    }

    cleanup() {}

    show: EventHandler<'show'> = () => {
        return { state: { $set: 'visible' } }
    }

    hide: EventHandler<'hide'> = () => {
        return { state: { $set: 'hidden' } }
    }
}
