import { UserFeatureOptIn } from 'src/features/background/feature-opt-ins'
import { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { SummarizationInterface } from 'src/summarization-llm/background'
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
    summarizeBG: SummarizationInterface
}

export interface AnnotationFunctions {
    createHighlight(shouldShare: boolean): Promise<void>
    createAnnotation(
        shouldShare: boolean,
        showSpacePicker?: boolean,
    ): Promise<void>
}
export interface ToolTipFunctions {
    openToolTipInAIMode: () => void
}
