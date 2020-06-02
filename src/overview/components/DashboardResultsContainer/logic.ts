import { UILogic } from 'ui-logic-core'
import {
    DashboardResultsDependencies,
    DashboardResultsEvent,
    DashboardResultsState,
} from 'src/overview/components/DashboardResultsContainer/types'
import { InPageUI } from 'src/in-page-ui/shared-state'
import EventEmitter from 'events'
import TypedEventEmitter from 'typed-emitter'
import {
    InPageUIEvents,
    InPageUIInterface,
} from 'src/in-page-ui/shared-state/types'

export default class DashboardResultsLogic extends UILogic<
    DashboardResultsState,
    DashboardResultsEvent
> {
    overviewUIEvents = new EventEmitter() as TypedEventEmitter<InPageUIEvents>

    dashboardUI = new InPageUI({
        loadComponent: (c) => null,
        pageUrl: '',
        annotations: null,
        highlighter: null,
    })

    constructor(private dependencies: DashboardResultsDependencies) {
        super()
    }

    get mockInPageUI(): InPageUIInterface {
        return {
            state: { sidebar: false },
            events: this.overviewUIEvents as InPageUI['events'],
            hideRibbon: () => undefined,
            hideSidebar: () => undefined,
        } as InPageUIInterface
    }

    get mockHighlighter() {
        return {
            removeTempHighlights: () => undefined,
            renderHighlight: () => undefined,
        }
    }

    getInitialState(): DashboardResultsState {
        return {
            readerShow: false,
            readerUrl: null,
            dashboardUI: this.dashboardUI,
            highlighter: this.mockHighlighter,
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
