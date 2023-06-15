import { MemexTheme } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import type { UIServices } from 'src/services/ui/types'

export interface DashboardResultsDependencies {
    theme: MemexTheme
    services: UIServices
    analyticsBG: AnalyticsCoreInterface
}

export interface DashboardResultsState {
    readerShow: boolean
    readerUrl: string
    // TODO: (sidebar-refactor, priority 1) - Dashboard instansiation fo the sidebar, doesn't want to care about other 'inpageui' components.
    // dashboardSharedUIState: SharedInPageUIInterface
}

export interface DashboardResultsEvent {
    handleReaderClose: {}
    handleToggleAnnotationsSidebar: { pageUrl: string; pageTitle: string }
    handleReaderViewClick: string
}
