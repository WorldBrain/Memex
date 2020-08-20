import { UILogic } from 'ui-logic-core'
import {
    DashboardResultsDependencies,
    DashboardResultsEvent,
    DashboardResultsState,
} from 'src/overview/components/DashboardResultsContainer/types'
import { EventEmitter } from 'events'
import TypedEventEmitter from 'typed-emitter'
import {
    SharedInPageUIEvents,
    SharedInPageUIInterface,
} from 'src/in-page-ui/shared-state/types'
import { SharedInPageUIState } from 'src/in-page-ui/shared-state/shared-in-page-ui-state'
import { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'

export default class DashboardResultsLogic extends UILogic<
    DashboardResultsState,
    DashboardResultsEvent
> {
    overviewUIEvents = new EventEmitter() as TypedEventEmitter<
        SharedInPageUIEvents
    >

    dashboardUI = new SharedInPageUIState({
        loadComponent: (c) => null,
        unloadComponent: (c) => null,
        pageUrl: '',
        normalizedPageUrl: '',
    })

    constructor(private dependencies: DashboardResultsDependencies) {
        super()
    }

    getInitialState(): DashboardResultsState {
        return {
            readerShow: false,
            readerUrl: null,
        }
    }

    getDashboardUILogic = () => {}

    handleReaderViewClick = ({ event }) => {
        this.emitMutation({
            readerShow: { $set: true },
            readerUrl: { $set: event },
        })
        // testing
        this.overviewUIEvents.emit('stateChanged', {
            changes: { sidebar: true },
            newState: null,
        })
    }
    handleToggleAnnotationsSidebar = ({
        event: { pageUrl, pageTitle },
        prevState,
    }) => {
        this.dashboardUI.showSidebar()
    }

    handleReaderClose = ({ event }) =>
        this.emitMutation({
            readerShow: { $set: false },
            readerUrl: { $set: null },
        })
}
