import { UILogic, UIEvent, UIEventHandler } from 'ui-logic-core'
import type { RibbonContainerDependencies } from '../ribbon/types'
import type {
    SharedInPageUIInterface,
    InPageUIComponentShowState,
    ShouldSetUpOptions,
} from 'src/in-page-ui/shared-state/types'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { Browser } from 'webextension-polyfill'

export interface RibbonHolderState {
    state: 'visible' | 'hidden'
    isSidebarOpen: boolean
    keepPageActivityIndicatorHidden: boolean
    isRibbonEnabled?: boolean
    ribbonPosition: 'topRight' | 'bottomRight' | 'centerRight'
}

export type RibbonHolderEvents = UIEvent<{
    show: null
    hide: null
    openSidebarToSharedSpaces: null
    selectRibbonPositionOption: null
}>

export interface RibbonHolderDependencies {
    setUpOptions: ShouldSetUpOptions
    inPageUI: SharedInPageUIInterface
    containerDependencies: RibbonContainerDependencies
    analyticsBG: AnalyticsCoreInterface
    events: AnnotationsSidebarInPageEventEmitter
    browserAPIs: Browser
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
            keepPageActivityIndicatorHidden: false,
            ribbonPosition: null,
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        this.dependencies.inPageUI.events.on(
            'stateChanged',
            this._handleUIStateChange,
        )

        const ribbonPosition = await this.dependencies.containerDependencies.syncSettings.inPageUI.get(
            'ribbonPosition',
        )

        this.emitMutation({
            ribbonPosition: {
                $set: ribbonPosition ?? 'bottomRight',
            },
        })

        if (ribbonPosition == null) {
            await this.dependencies.containerDependencies.syncSettings.inPageUI.set(
                'ribbonPosition',
                'bottomRight',
            )
        }

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

    selectRibbonPositionOption: EventHandler<
        'selectRibbonPositionOption'
    > = async ({ event }) => {
        const ribbonPosition = await this.dependencies.containerDependencies.syncSettings.inPageUI.set(
            'ribbonPosition',
            event,
        )

        this.emitMutation({
            ribbonPosition: {
                $set: event,
            },
        })

        // return this.dependencies.customLists.addOpenTabsToList({
        //     listId: event?.value,
        // })
    }

    show: EventHandler<'show'> = () => {
        return { state: { $set: 'visible' } }
    }

    hide: EventHandler<'hide'> = () => {
        return { state: { $set: 'hidden' } }
    }

    openSidebarToSharedSpaces: EventHandler<
        'openSidebarToSharedSpaces'
    > = async ({}) => {
        this.emitMutation({
            keepPageActivityIndicatorHidden: { $set: true },
        })
        await this.dependencies.inPageUI.showSidebar({
            action: 'show_shared_spaces',
        })
    }

    _handleUIStateChange = (event: {
        newState: InPageUIComponentShowState
    }) => {
        this.emitMutation({ isSidebarOpen: { $set: event.newState.sidebar } })

        if (event.newState.sidebar === true) {
            this.emitMutation({
                keepPageActivityIndicatorHidden: { $set: true },
            })
        }
    }

    // showNudges: EventHandler<
    //     'showNudges'
    // > = async ({}) => {

    //     this.emitMutation({
    //         showNudges: { $set: true },
    //     })
    //     await this.dependencies.inPageUI.showSidebar({
    //         action: 'show_shared_spaces',
    //     })
    // }
}
