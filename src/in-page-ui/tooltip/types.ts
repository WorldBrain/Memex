import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { ToolbarNotificationsInterface } from 'src/toolbar-notification/content_script/types'

export interface TooltipPosition {
    x: number
    y: number
}

export type TooltipInPageUIInterface = Pick<
    SharedInPageUIInterface,
    'events' | 'hideTooltip' | 'showTooltip' | 'removeTooltip' | 'showSidebar'
>

export interface TooltipDependencies extends AnnotationFunctions {
    inPageUI: SharedInPageUIInterface
    toolbarNotifications: ToolbarNotificationsInterface
}

export interface AnnotationFunctions {
    createHighlight(): Promise<void>
    createAnnotation(): Promise<void>
}
