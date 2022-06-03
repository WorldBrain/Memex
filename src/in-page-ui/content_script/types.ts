import {
    InPageUIRibbonAction,
    SidebarActionOptions,
} from '../shared-state/types'
import { AnnotationFunctions } from 'src/in-page-ui/tooltip/types'
import { Annotation } from 'src/annotations/types'

export interface InPageUIContentScriptRemoteInterface
    extends AnnotationFunctions {
    showSidebar(options?: SidebarActionOptions): Promise<void>

    // Ribbon
    showRibbon(options?: { action?: InPageUIRibbonAction }): Promise<void>
    insertRibbon(): Promise<void>
    removeRibbon(): Promise<void>
    reloadRibbon(): Promise<void>
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
    removeHighlights(): Promise<void>

    teardownContentScripts(): Promise<void>

    /**
     * Acts as a way for the BG script to check if the content script is
     * available on a given tab. Should throw error if not.
     */
    ping(): Promise<true>
}
