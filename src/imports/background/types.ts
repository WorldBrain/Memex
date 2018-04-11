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
