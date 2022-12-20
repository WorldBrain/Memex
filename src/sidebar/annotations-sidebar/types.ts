import type TypedEventEmitter from 'typed-emitter'
import type { ResultWithIndex } from 'src/overview/types'
import type { UnifiedAnnotation } from 'src/annotations/cache/types'

export interface Page {
    url?: string
    title?: string
}

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void

export type SidebarEnv = 'inpage' | 'overview'
export type AnnotationMode = 'default' | 'edit' | 'delete'

export interface ResultsByUrl {
    [url: string]: ResultWithIndex
}

export { ResultWithIndex }

export interface HighlighterEvents {
    renderHighlight: (args: { highlight: UnifiedAnnotation }) => void
    renderHighlights: (args: { highlights: UnifiedAnnotation[] }) => void
    highlightAndScroll: (args: { url: string }) => void
    removeTemporaryHighlights: () => void
    removeAnnotationHighlight: (args: { url: string }) => void
    removeAnnotationHighlights: (args: { urls: string[] }) => void
    hideHighlights: () => void
    showHighlights: () => void
}

export interface AnnotationsSidebarInPageEvents extends HighlighterEvents {
    setSelectedSpace: (args: SelectedSpaceState) => void
}

export interface AnnotationStorageInterface {}

export type AnnotationsSidebarInPageEventEmitter = TypedEventEmitter<
    AnnotationsSidebarInPageEvents
>

export interface SidebarTheme {
    canClickAnnotations: boolean
    rightOffsetPx: number
    topOffsetPx: number
    paddingRight: number
}

export type SelectedSpaceState =
    // Followed-only space
    | {
          localId: null
          remoteId: string
      }
    // Local-only space
    | {
          localId: number
          remoteId: null
      }
    // Joined/own shared space
    | {
          remoteId: string
          localId: number
      }
