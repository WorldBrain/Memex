export interface ListObject {
    id: Number
    name: string
    pages?: string[]
    isNestable: 0 | 1
    isDeletable: 0 | 1
}

export interface PageObject {
    pageUrl: string
    crearedAt: Date
    listId: Number
    fullUrl: string
}
