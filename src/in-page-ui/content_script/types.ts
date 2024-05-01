import type { RawPageContent } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/types'
import type {
    InPageUIRibbonAction,
    SidebarActionOptions,
} from '../shared-state/types'
import type { ExtractedPDFData } from '@worldbrain/memex-common/lib/page-indexing/types'
import type { UnifiedAnnotation } from 'src/annotations/cache/types'

export interface InPageUIContentScriptRemoteInterface {
    showSidebar(options?: SidebarActionOptions): Promise<void>

    // Ribbon
    showRibbon(options?: { action?: InPageUIRibbonAction }): Promise<void>
    insertRibbon(): Promise<void>
    removeRibbon(): Promise<void>
    reloadRibbon(): Promise<void>
    updateRibbon(): Promise<void>
    insertOrRemoveRibbon(): Promise<void>
    testIfSidebarSetup: () => Promise<void>

    // Tooltip
    showContentTooltip(): Promise<void>
    insertTooltip(): Promise<void>
    removeTooltip(): Promise<void>
    insertOrRemoveTooltip(): Promise<void>

    // Highlights
    goToHighlight(
        annotationCacheId: UnifiedAnnotation['localId'],
    ): Promise<void>
    removeHighlights(): Promise<void>
    createHighlight(
        shouldShare: boolean,
        shouldCopyLink: boolean,
    ): Promise<void>
    saveImageAsNewNote(imageData: string): Promise<void>
    analyseImageAsWithAI(imageData: string): Promise<void>

    teardownContentScripts(): Promise<void>
    handleHistoryStateUpdate(tabId: number): Promise<void>
    extractRawPageContent: () => Promise<RawPageContent>

    /**
     * Acts as a way for the BG script to check if the content script is
     * available on a given tab. Should throw error if not.
     */
    confirmTabScriptLoaded(): Promise<void>
}

export interface InPDFPageUIContentScriptRemoteInterface {
    extractPDFContents(): Promise<ExtractedPDFData | null>
    getObjectUrlForPdf(): Promise<{ objectUrl: string }>
    setPdfUploadState(isUploading: boolean): Promise<void>
}
