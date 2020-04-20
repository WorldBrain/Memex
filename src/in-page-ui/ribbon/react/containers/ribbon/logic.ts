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

export interface RibbonContainerState {
    state: 'visible' | 'hidden'
}

export type RibbonContainerEvents = UIEvent<{
    show: null
    hide: null
}>

export interface RibbonContainerDependencies {
    ribbonEvents: RibbonControllerEventEmitter
    currentTab: { id: number }
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    highlighter: Pick<HighlightInteractionInterface, 'removeHighlights'>
    annotationsManager: AnnotationsManager
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
    constructor(private dependencies: RibbonContainerDependencies) {
        super()
    }

    getInitialState(): RibbonContainerState {
        return {
            state: 'hidden',
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
