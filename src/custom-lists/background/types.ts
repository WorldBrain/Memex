export interface PageList {
    id: number
    name: string
    pages?: string[]
    isNestable: 0 | 1
    isDeletable: 0 | 1
}

export interface PageListEntry {
    pageUrl: string
    crearedAt: Date
    listId: number
    fullUrl: string
}
