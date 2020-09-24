import { Annotation } from 'src/annotations/types'
import { SaveAndRenderHighlightDeps } from 'src/highlighting/ui/highlight-interactions'
import { AnnotationClickHandler } from './ui/types'

export interface Descriptor {
    strategy: string
    content: any
}

export interface Anchor {
    quote: string
    descriptor: Descriptor
}

export type Highlight = Pick<Annotation, 'url' | 'selector'> & {
    temporary?: boolean
}

export interface HighlightInteractionsInterface {
    renderHighlights: (
        highlights: Highlight[],
        openSidebar: AnnotationClickHandler,
    ) => Promise<void>
    renderHighlight: (
        highlight: Highlight,
        openSidebar: AnnotationClickHandler,
        temporary?: boolean,
    ) => Promise<boolean>
    scrollToHighlight: ({ url }: Highlight) => number
    highlightAndScroll: (annotation: Annotation) => number
    attachEventListenersToNewHighlights: (
        highlight: Highlight,
        openSidebar: AnnotationClickHandler,
    ) => void
    removeMediumHighlights: () => void
    removeTempHighlights: () => void
    makeHighlightMedium: ({ url }: Highlight) => void
    makeHighlightDark: ({ url }: Highlight) => void
    removeHighlights: (onlyRemoveDarkHighlights?: boolean) => void
    sortAnnotationsByPosition: (annotations: Annotation[]) => Annotation[]
    _removeHighlight: (highlight: Element) => void
    removeAnnotationHighlights: (url: string) => void
    saveAndRenderHighlight: (
        params: SaveAndRenderHighlightDeps,
    ) => Promise<void>
    saveAndRenderHighlightAndEditInSidebar: (
        params: SaveAndRenderHighlightDeps,
    ) => Promise<void>
}
