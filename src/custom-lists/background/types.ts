export interface PageList {
    id: number
    name: string
    pages?: string[]
    isNestable?: boolean
    isDeletable?: boolean
    active?: boolean
}

export interface PageListEntry {
    pageUrl: string
    crearedAt: Date
    listId: number
    fullUrl: string
}
