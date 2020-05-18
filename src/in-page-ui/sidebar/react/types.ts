import { ResultWithIndex } from 'src/overview/types'

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
