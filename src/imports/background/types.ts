import { Annotation } from 'src/annotations/types'

export type ImportItemType = 'h' | 'b'

export interface ImportItem {
    type: ImportItemType
    browserId: number
    url: string
}

export interface BrowserItem {
    id: number
    url: string
    type: ImportItemType
}

export interface Item {
    url: string
    title?: string
    collections?: string[]
    tags?: string[]
    annotations?: Annotation[]
    comments?: string
    timeAdded?: number
}

export type ServiceParser = (doc: Document) => Item[]
export type RecursiveNetscapeParser = (
    element: Element,
    items: Item[],
    parentCollectionName: string,
) => Item[]
