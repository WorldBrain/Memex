import { ToolbarNotificationsInterface } from 'src/toolbar-notification/content_script/types'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'

export interface TooltipPosition {
    x: number
    y: number
}

export type TooltipInPageUIInterface = Pick<
    InPageUIInterface,
    'events' | 'hideTooltip' | 'showTooltip' | 'removeTooltip' | 'showSidebar'
>
export interface TooltipDependencies extends AnnotationFunctions {
    inPageUI: InPageUIInterface
    toolbarNotifications: ToolbarNotificationsInterface
}

export interface AnnotationFunctions {
    createHighlight(): Promise<void>
    createAnnotation(): Promise<void>
}
