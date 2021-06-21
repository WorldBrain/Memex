import TypedEventEmitter from 'typed-emitter'

import { Highlight } from 'src/highlighting/types'
import { ResultWithIndex } from 'src/overview/types'
import { SidebarDisplayMode } from './containers/types'

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
    renderHighlight: (args: { highlight: Highlight }) => void
    renderHighlights: (args: {
        highlights: Highlight[]
        displayMode?: SidebarDisplayMode
    }) => void
    highlightAndScroll: (args: { url: string }) => void
    removeTemporaryHighlights: () => void
    removeAnnotationHighlight: (args: { url: string }) => void
    removeAnnotationHighlights: (args: { urls: string[] }) => void
    hideHighlights: () => void
    showHighlights: () => void
}

export interface AnnotationsSidebarInPageEvents extends HighlighterEvents {}

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
