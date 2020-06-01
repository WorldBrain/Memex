import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'

export interface TooltipPosition {
    x: number
    y: number
}

export type TooltipInPageUIInterface = Pick<
    InPageUIInterface,
    'events' | 'hideTooltip' | 'showTooltip' | 'removeTooltip' | 'showSidebar'
>
