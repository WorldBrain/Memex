export type { Anchor } from '@worldbrain/memex-common/lib/annotations/types'
import type { UnifiedAnnotation } from 'src/annotations/cache/types'
import type { Annotation } from 'src/annotations/types'
import type { AnnotationClickHandler } from './ui/types'
import type { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import type { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'
import type { AnalyticsEvent } from 'src/analytics/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

export type Highlight = Pick<Annotation, 'url' | 'selector'> & {
    temporary?: boolean
    domElements?: HighlightElement[]
}

export type HighlightElement = HTMLElement

export interface HighlightInteractionsInterface {
    renderHighlights: (
        highlights: UnifiedAnnotation[],
        onClick: AnnotationClickHandler,
        temp?: boolean,
    ) => Promise<void>
    renderHighlight: (
        highlight: UnifiedAnnotation,
        onClick: AnnotationClickHandler,
        temp?: boolean,
    ) => Promise<void>
    scrollToHighlight: (highlight: UnifiedAnnotation) => void
    highlightAndScroll: (annotation: UnifiedAnnotation) => void
    attachEventListenersToNewHighlights: (
        highlight: UnifiedAnnotation,
        openSidebar: AnnotationClickHandler,
    ) => void
    removeMediumHighlights: () => void
    removeTempHighlights: () => void
    makeHighlightMedium: (highlight: UnifiedAnnotation) => void
    makeHighlightDark: (highlight: UnifiedAnnotation) => void
    removeHighlights: (args?: { onlyRemoveDarkHighlights?: boolean }) => void
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
    getUrlAndTitle: () => Promise<{ pageUrl: string; title: string }>
    getSelection: () => Selection
    annotationsCache: PageAnnotationsCacheInterface
    analyticsEvent?: AnalyticsEvent
    inPageUI: SharedInPageUIInterface
    showSpacePicker?: boolean
    currentUser?: UserReference
    shouldShare?: boolean
}
