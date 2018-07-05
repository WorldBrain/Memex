export interface PageList {
    id: Number
    name: string
    pages?: string[]
    isNestable: 0 | 1
    isDeletable: 0 | 1
}

export interface PageListEntry {
    pageUrl: string
    crearedAt: Date
    listId: Number
    fullUrl: string
}
