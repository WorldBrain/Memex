export type { Anchor } from '@worldbrain/memex-common/lib/annotations/types'
import type { UnifiedAnnotation } from 'src/annotations/cache/types'
import type { Annotation } from 'src/annotations/types'
import type { AnnotationClickHandler } from './ui/types'
import type { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import type { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'
import type { AnalyticsEvent } from 'src/analytics/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

export type _UnifiedAnnotation = Pick<
    UnifiedAnnotation,
    'unifiedId' | 'selector'
>

export type Highlight = Pick<Annotation, 'url' | 'selector'> & {
    temporary?: boolean
    domElements?: HighlightElement[]
}

export type HighlightElement = HTMLElement

export interface HighlightInteractionsInterface {
    renderHighlights: (
        highlights: _UnifiedAnnotation[],
        onClick: AnnotationClickHandler,
        opts?: { temp?: boolean; removeExisting?: boolean },
    ) => Promise<void>
    renderHighlight: (
        highlight: _UnifiedAnnotation,
        onClick: AnnotationClickHandler,
        temp?: boolean,
    ) => Promise<void>
    highlightAndScroll: (annotation: _UnifiedAnnotation) => Promise<void>
    attachEventListenersToNewHighlights: (
        highlight: _UnifiedAnnotation,
        openSidebar: AnnotationClickHandler,
    ) => void
    removeHoveredHighlights: (annotation: _UnifiedAnnotation) => void
    removeTempHighlights: () => void
    hoverOverHighlight: (highlight: _UnifiedAnnotation) => void
    selectHighlight: (highlight: _UnifiedAnnotation) => void
    removeSelectedHighlights: (highlight: _UnifiedAnnotation) => void
    resetHighlightsStyles: () => void
    // sortAnnotationsByPosition: (annotations: Annotation[]) => Annotation[]
    _removeHighlight: (highlight: Element) => void
    removeAnnotationHighlight: (url: string) => void
    removeAnnotationHighlights: (urls: string[]) => void
    saveAndRenderHighlight: (
        params: SaveAndRenderHighlightDeps,
    ) => Promise<void>
    saveAndRenderHighlightAndEditInSidebar: (
        params: SaveAndRenderHighlightDeps,
    ) => Promise<void>
}

export interface SaveAndRenderHighlightDeps {
    getFullPageUrlAndTitle: () => Promise<{
        fullPageUrl: string
        title: string
    }>
    getSelection: () => Selection
    annotationsCache: PageAnnotationsCacheInterface
    analyticsEvent?: AnalyticsEvent
    inPageUI: SharedInPageUIInterface
    showSpacePicker?: boolean
    currentUser?: UserReference
    shouldShare?: boolean
}
