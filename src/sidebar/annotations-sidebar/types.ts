import type TypedEventEmitter from 'typed-emitter'
import type {
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import { SidebarTab } from './containers/types'

export type AnnotationsSidebarInPageEventEmitter = TypedEventEmitter<{
    setSelectedList: (unifiedListId: UnifiedList['unifiedId']) => void
    renderHighlight: (args: { highlight: UnifiedAnnotation }) => void
    renderHighlights: (args: {
        highlights: UnifiedAnnotation[]
        removeExisting: boolean
    }) => void
    highlightAndScroll: (args: { highlight: UnifiedAnnotation }) => void
    triggerYoutubeTimestampSummary: (
        args: { text: string; showLoadingSpinner?: boolean },
        callback,
    ) => void
    triggerListenerRestart: () => void
    addImageToEditor: (args: { imageData: string }, callback) => void
    addVideoSnapshotToEditor: (args: { imageData: string }, callback) => void
    addSelectedTextToAIquery: (selectedText: string, callback) => void
    setActiveSidebarTab: (args: { activeTab: SidebarTab }) => void
    // No longer used, as of the sidebar refactor
    // removeTemporaryHighlights: () => void
    // removeAnnotationHighlight: (args: { url: string }) => void
    // removeAnnotationHighlights: (args: { urls: string[] }) => void
    // hideHighlights: () => void
    // showHighlights: () => void
}>

export interface SidebarTheme {
    canClickAnnotations: boolean
    rightOffsetPx: number
    topOffsetPx: number
    paddingRight: number
}

export type AnnotationCardInstanceLocation =
    | 'annotations-tab'
    | UnifiedList['unifiedId']
