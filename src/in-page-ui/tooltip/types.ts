import type { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import type { AnnotationFunctions } from '@worldbrain/memex-common/lib/in-page-ui/types'

export type TooltipInPageUIInterface = Pick<
    SharedInPageUIInterface,
    'events' | 'hideTooltip' | 'showTooltip' | 'removeTooltip' | 'showSidebar'
>

export interface TooltipDependencies extends AnnotationFunctions {
    inPageUI: SharedInPageUIInterface
}
