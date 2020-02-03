import { Annotation } from 'src/annotations/types'

export interface Descriptor {
    strategy: string
    content: any
}

export interface Anchor {
    quote: string
    descriptor: Descriptor
}

// TODO this seems to be a polymorphic type coming from the coffeescript anchoring, fill it in
export interface DOMSelector {
    descriptor: Descriptor
}

export interface Highlight {
    url: string
    anchors?: Anchor[]
    selector?: DOMSelector
}

export interface HighlightInteractionInterface {
    renderHighlights: (
        highlights: Highlight[],
        openSidebar: (args: { activeUrl?: string }) => void,
        focusOnHighlight?: (url: string) => void,
        hoverHighlightContainer?: (url: string) => void,
    ) => Promise<void>
    renderHighlight: (
        highlight: Highlight,
        focusOnAnnotation,
        hoverAnnotationContainer,
        openSidebar,
        temporary?: boolean,
    ) => Promise<boolean>
    scrollToHighlight: ({ url }: Highlight) => number
    highlightAndScroll: (annotation: Annotation) => number
    attachEventListenersToNewHighlights: (
        highlight: Highlight,
        focusOnAnnotation: (url: string) => void,
        hoverAnnotationContainer: (url: string) => void,
        openSidebar: (args: { activeUrl?: string }) => void,
    ) => void
    removeMediumHighlights: () => void
    removeTempHighlights: () => void
    makeHighlightMedium: ({ url }: Highlight) => void
    makeHighlightDark: ({ url }: Highlight) => void
    removeHighlights: (onlyRemoveDarkHighlights?: boolean) => void
    sortAnnotationsByPosition: (annotations: Annotation[]) => Annotation[]
    _removeHighlight: (highlight: Element) => void
    removeAnnotationHighlights: (url: string) => void
}
