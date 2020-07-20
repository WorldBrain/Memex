import TypedEventEmitter from 'typed-emitter'

import { Highlight } from 'src/highlighting/types'
import { ResultWithIndex } from 'src/overview/types'
import { SidebarContainerState } from 'src/sidebar/annotations-sidebar/containers/logic'

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

export type StateSelector<ReturnType> = (
    state: SidebarContainerState,
) => ReturnType

///

export interface HighlighterEvents {
    renderHighlight: (args: { highlight: Highlight }) => void
    highlightAndScroll: (args: { url: string }) => void
    removeTemporaryHighlights: () => void
    removeAnnotationHighlights: (args: { url: string }) => void
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
