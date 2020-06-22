import { UILogic } from 'ui-logic-core'
import {
    PdfViewerDependencies,
    PdfViewerResultsEvent,
    PdfViewerResultsState,
} from 'src/pdf-viewer/PdfViewerContainer/types'
import { InPageUI } from 'src/in-page-ui/shared-state'
import EventEmitter from 'events'
import TypedEventEmitter from 'typed-emitter'
import {
    InPageUIEvents,
    InPageUIInterface,
} from 'src/in-page-ui/shared-state/types'

export default class PdfViewerResultsLogic extends UILogic<
    PdfViewerResultsState,
    PdfViewerResultsEvent
> {
    overviewUIEvents = new EventEmitter() as TypedEventEmitter<InPageUIEvents>

    pdfViewerUI = new InPageUI({
        loadComponent: (c) => null,
        pageUrl: '',
        annotations: null,
        highlighter: null,
    })

    constructor(private dependencies: PdfViewerDependencies) {
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

    getInitialState(): PdfViewerResultsState {
        return {
            viewerShow: false,
            pdfUrl: null,
            pdfUI: this.pdfViewerUI,
            highlighter: this.mockHighlighter,
        }
    }

    getPdfViewerUILogic = () => {}

    handlePdfViewClick = ({ event }) => {
        this.emitMutation({
            viewerShow: { $set: true },
            pdfUrl: { $set: event },
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
        this.pdfViewerUI.showSidebar()
    }

    handleViewerClose = ({ event }) =>
        this.emitMutation({
            viewerShow: { $set: false },
            pdfUrl: { $set: null },
        })
}
