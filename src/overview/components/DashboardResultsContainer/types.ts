export interface DashboardResultsDependencies {}

export interface DashboardResultsState {
    readerShow: boolean
    readerUrl: string
    dashboardUI: any
    highlighter: any
}

export interface DashboardResultsEvent {
    handleReaderClose: {}
    handleToggleAnnotationsSidebar: { pageUrl: string; pageTitle: string }
    handleReaderViewClick: string
}
