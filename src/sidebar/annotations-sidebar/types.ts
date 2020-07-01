import TypedEventEmitter from 'typed-emitter'

import { ResultWithIndex } from 'src/overview/types'
import { SidebarContainerState } from 'src/sidebar/annotations-sidebar/containers/old/sidebar-annotations/logic'

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

export interface AnnotationsSidebarEvents {
    pressedCloseSidebar: () => void
    pressedAnnotationHighlight: () => void
    savedAnnotationHighlight: () => void
    changedAnnotationQuery: () => void
    pressedAnnotationQuery: () => void
}

export interface AnnotationStorageInterface {}

type AnnotationsSidebarEventEmitter = TypedEventEmitter<
    AnnotationsSidebarEvents
>
