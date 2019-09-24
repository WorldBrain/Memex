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

export interface Tab {
    tabId: number
    url: string
}

export interface CustomListsInterface {
    createCustomList: any
    insertPageToList: any
    updateListName: any
    removeList: any
    removePageFromList: any
    fetchAllLists: any
    fetchListById: any
    fetchListPagesByUrl: any
    fetchListNameSuggestions: any
    fetchListPagesById: any
    fetchListIgnoreCase: any
    addOpenTabsToList: any
    removeOpenTabsFromList: any
}
