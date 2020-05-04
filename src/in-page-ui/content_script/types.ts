import { InPageUIRibbonAction } from '../shared-state/types'

export interface InPageUIContentScriptRemoteInterface {
    showSidebar(): Promise<void>

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
}
