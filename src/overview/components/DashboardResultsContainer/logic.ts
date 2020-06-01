import { UILogic } from 'ui-logic-core'
import {
    DashboardResultsDependencies,
    DashboardResultsEvent,
    DashboardResultsState,
} from 'src/overview/components/DashboardResultsContainer/types'
import { InPageUI } from 'src/in-page-ui/shared-state'
import EventEmitter from 'events'
import TypedEventEmitter from 'typed-emitter'
import { InPageUIEvents } from 'src/in-page-ui/shared-state/types'

export default class DashboardResultsLogic extends UILogic<
    DashboardResultsState,
    DashboardResultsEvent
> {
    overviewUIEvents = new EventEmitter() as TypedEventEmitter<InPageUIEvents>

    constructor(private dependencies: DashboardResultsDependencies) {
        super()
    }

    get mockInPageUI() {
        return {
            state: {},
            events: this.overviewUIEvents as InPageUI['events'],
            hideRibbon: () => undefined,
            hideSidebar: () => undefined,
        }
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
            dashboardUI: this.mockInPageUI,
            highlighter: this.mockHighlighter,
        }
    }

    getDashboardUILogic = () => {}

    handleReaderViewClick = ({ event }) => {
        this.emitMutation({
            readerShow: { $set: true },
            readerUrl: { $set: event },
        })
    }
    handleToggleAnnotationsSidebar = ({ event: { pageUrl, pageTitle } }) => null

    handleReaderClose = ({ event }) =>
        this.emitMutation({
            readerShow: { $set: false },
            readerUrl: { $set: null },
        })
}
