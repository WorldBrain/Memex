import {
    UILogic,
    UIEvent,
    UIEventHandlers,
    IncomingUIEvent,
    UIMutation,
} from 'ui-logic-core'
import { uiLoad } from 'ui-logic-core/lib/patterns'
import { TaskState } from 'ui-logic-core/lib/types'
import { SidebarControllerEventEmitter } from '../../../types'
import { SidebarEnv } from '../../types'
import { Annotation } from 'src/annotations/types'

export interface SidebarContainerState {
    state: 'visible' | 'hidden'
    loadState: TaskState
    annotations: Annotation[]
}

export type SidebarContainerEvents = UIEvent<{
    show: null
    hide: null
}>

export interface SidebarContainerDependencies {
    sidebarEvents: SidebarControllerEventEmitter
    env: SidebarEnv
    currentTab: { id: number; url: string }
    loadAnnotatons(url: string): Promise<Annotation[]>
}

export class SidebarContainerLogic extends UILogic<
    SidebarContainerState,
    SidebarContainerEvents
>
// implements UIEventHandlers<SidebarContainerState, SidebarContainerEvents>
{
    constructor(private dependencies: SidebarContainerDependencies) {
        super()
    }

    getInitialState(): SidebarContainerState {
        return {
            state: 'visible',
            loadState: 'pristine',
            annotations: [],
        }
    }

    async init() {
        await uiLoad<SidebarContainerState>(this, async () => {
            const loadAnnotations = this.dependencies.loadAnnotatons(
                this.dependencies.currentTab.url,
            )
            const [annotations] = await Promise.all([loadAnnotations])
            this.emitMutation({ annotations: { $set: annotations } })
        })
    }

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
