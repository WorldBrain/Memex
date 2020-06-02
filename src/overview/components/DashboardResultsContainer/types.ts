import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'

export interface DashboardResultsDependencies {}

export interface DashboardResultsState {
    readerShow: boolean
    readerUrl: string
    dashboardUI: InPageUIInterface
    highlighter: any
}

export interface DashboardResultsEvent {
    handleReaderClose: {}
    handleToggleAnnotationsSidebar: { pageUrl: string; pageTitle: string }
    handleReaderViewClick: string
}
