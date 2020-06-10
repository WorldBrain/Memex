import { ToolbarNotificationsInterface } from 'src/toolbar-notification/content_script/types'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { AnnotationsManagerInterface } from 'src/annotations/types'
import { HighlightInteractionInterface } from 'src/highlighting/types'

export interface TooltipPosition {
    x: number
    y: number
}

export interface TooltipDependencies {
    inPageUI: InPageUIInterface
    highlighter: HighlightInteractionInterface
    annotationsManager: AnnotationsManagerInterface
    toolbarNotifications: ToolbarNotificationsInterface
}
