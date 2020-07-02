import TypedEventEmitter from 'typed-emitter'

import { ResultWithIndex } from 'src/overview/types'
import { SidebarContainerState } from 'src/sidebar/annotations-sidebar/containers/old/sidebar-annotations/logic'
import { NewAnnotationOptions } from 'src/annotations/types'

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

type StandardAnnotationEventListener<ExtraArgs = {}> = (
    args: { url: string } & ExtraArgs,
) => void

export interface HighlighterEvents {
    removeTemporaryHighlights: () => void
}

export interface AnnotationCreateEvents {
    clickConfirmAnnotationCreateBtn: (args: NewAnnotationOptions) => void
    clickCancelAnnotationCreateBtn: () => void
}

export interface AnnotationEvents {
    clickAnnotation: StandardAnnotationEventListener
    clickAnnotationTag: StandardAnnotationEventListener<{ tag: string }>
    clickAnnotationTagBtn: StandardAnnotationEventListener
    clickAnnotationBookmarkBtn: StandardAnnotationEventListener
    clickAnnotationDeleteBtn: StandardAnnotationEventListener
    clickAnnotationEditBtn: StandardAnnotationEventListener
    clickAnnotationShareBtn: StandardAnnotationEventListener
    clickConfirmAnnotationDeleteBtn: StandardAnnotationEventListener
    clickCancelAnnotationDeleteBtn: StandardAnnotationEventListener
    clickConfirmAnnotationEditBtn: StandardAnnotationEventListener<{
        comment: string
        tags: string[]
    }>
    clickCancelAnnotationEditBtn: StandardAnnotationEventListener
    changeAnnotationComment: StandardAnnotationEventListener<{
        comment: string
    }>
    startAnnotationHover: StandardAnnotationEventListener
    endAnnotationHover: StandardAnnotationEventListener
}

export interface AnnotationsSidebarEvents
    extends AnnotationEvents,
        AnnotationCreateEvents,
        HighlighterEvents {
    clickAnnotationHighlight: () => void
    saveAnnotationHighlight: () => void
    changeAnnotationQuery: () => void
    clickAnnotationQuery: () => void
    clickCloseSidebar: () => void
    paginateAnnotations: () => void
    queryAnnotations: (args: { query: string }) => void
}

export interface AnnotationStorageInterface {}

export type AnnotationsSidebarEventEmitter = TypedEventEmitter<
    AnnotationsSidebarEvents
>
