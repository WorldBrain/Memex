import type { Anchor } from '@worldbrain/memex-common/lib/annotations/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export type AnnotationClickHandler = (params: {
    annotationId: AutoPk
    openInEdit?: boolean
}) => Promise<void>

export interface RenderableAnnotation {
    id: AutoPk
    selector?: Anchor
}

export interface HighlightInteractionsInterface {
    renderHighlights: (
        highlights: RenderableAnnotation[],
        onClick: AnnotationClickHandler,
        opts?: {
            temp?: boolean
            removeExisting?: boolean
            dontWatchForRerenders?: boolean
        },
    ) => Promise<void>
    renderHighlight: (
        highlight: RenderableAnnotation,
        onClick: AnnotationClickHandler,
        opts?: {
            temp?: boolean
            isPdf?: boolean
        },
    ) => Promise<boolean>
    highlightAndScroll: (annotation: RenderableAnnotation) => Promise<void>
    removeTempHighlights: () => void
    resetHighlightsStyles: () => void
    removeAnnotationHighlight: (
        annotation: Pick<RenderableAnnotation, 'id'>,
    ) => void
    saveAndRenderHighlight: (
        params: SaveAndRenderHighlightDeps,
    ) => Promise<AutoPk | null>
}

export interface SaveAndRenderHighlightDeps {
    getFullPageUrl: () => Promise<string>
    getSelection: () => Selection
    onClick: AnnotationClickHandler
    currentUser?: UserReference
    shouldShare?: boolean
    isPdf?: boolean
}

export interface UndoHistoryEntry {
    url: string
    id: AutoPk
    type: 'annotation' | 'pagelistEntry'
}

export type { Anchor }
