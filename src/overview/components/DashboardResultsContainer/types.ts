import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { UIServices } from 'src/services/ui/types'
import type {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'

export interface DashboardResultsDependencies {
    services: UIServices
}

export interface DashboardResultsState {
    readerShow: boolean
    readerUrl: string
    themeVariant?: MemexThemeVariant
    theme?: MemexTheme
    // TODO: (sidebar-refactor, priority 1) - Dashboard instansiation fo the sidebar, doesn't want to care about other 'inpageui' components.
    // dashboardSharedUIState: SharedInPageUIInterface
}

export interface DashboardResultsEvent {
    handleReaderClose: {}
    handleToggleAnnotationsSidebar: { pageUrl: string; pageTitle: string }
    handleReaderViewClick: string
}
