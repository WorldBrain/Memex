import type {
    InPageUIRibbonAction,
    SidebarActionOptions,
} from '../shared-state/types'
import type { AnnotationFunctions } from 'src/in-page-ui/tooltip/types'
import type { ExtractedPDFData } from 'src/page-analysis/background/content-extraction/types'
import type { UnifiedAnnotation } from 'src/annotations/cache/types'

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
    testIfSidebarSetup: () => void

    // Tooltip
    showContentTooltip(): Promise<void>
    insertTooltip(): Promise<void>
    removeTooltip(): Promise<void>
    insertOrRemoveTooltip(): Promise<void>

    // Highlights
    goToHighlight(
        annotationCacheId: UnifiedAnnotation['unifiedId'],
    ): Promise<void>
    removeHighlights(): Promise<void>

    teardownContentScripts(): Promise<void>

    /**
     * Acts as a way for the BG script to check if the content script is
     * available on a given tab. Should throw error if not.
     */
    ping(): Promise<true>
}

export interface InPDFPageUIContentScriptRemoteInterface {
    extractPDFContents(): Promise<ExtractedPDFData | null>
}
