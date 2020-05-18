import {
    InPageUIRibbonAction,
    SidebarActionOptions,
} from '../shared-state/types'
import { Annotation } from 'src/annotations/types'

export interface InPageUIContentScriptRemoteInterface {
    showSidebar(options?: SidebarActionOptions): Promise<void>

    // Ribbon
    showRibbon(options?: { action?: InPageUIRibbonAction }): Promise<void>
    insertRibbon(): Promise<void>
    removeRibbon(): Promise<void>
    insertOrRemoveRibbon(): Promise<void>
    updateRibbon(): Promise<void>

    // Tooltip
    showContentTooltip(): Promise<void>
    insertTooltip(): Promise<void>
    removeTooltip(): Promise<void>
    insertOrRemoveTooltip(): Promise<void>

    // Highlights
    goToHighlight(
        annotation: Annotation,
        pageAnnotations: Annotation[],
    ): Promise<void>
}
