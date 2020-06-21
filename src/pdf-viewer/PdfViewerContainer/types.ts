import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'

export interface PdfViewerDependencies {}

export interface PdfViewerResultsState {
    viewerShow: boolean
    pdfUrl: string
    pdfUI: InPageUIInterface
    highlighter: any
}

export interface PdfViewerResultsEvent {
    handleViewerClose: {}
    handleToggleAnnotationsSidebar: { pageUrl: string; pageTitle: string }
    handlePdfViewClick: string
}
