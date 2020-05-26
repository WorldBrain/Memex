import { ResultWithIndex } from 'src/overview/types'
import { SidebarContainerState } from './containers/sidebar/logic'

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
