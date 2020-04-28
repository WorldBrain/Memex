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
    insertPageToList: (args: { id: number; url: string }) => Promise<void>
    updateListName: any
    removeList: any
    removePageFromList: (args: { id: number; url: string }) => Promise<void>
    fetchAllLists: any
    fetchListById: any
    fetchListPagesByUrl: any
    fetchListNameSuggestions: any
    fetchListPagesById: any
    fetchListIgnoreCase: any
    addOpenTabsToList: any
    removeOpenTabsFromList: any
}
