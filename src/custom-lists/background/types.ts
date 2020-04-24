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

export interface RemoteCollectionsInterface {
    createCustomList(args: { name: string }): Promise<number>
    insertPageToList(args: {
        id: number
        url: string
        tabId?: number
    }): Promise<{ object: PageListEntry }>
    updateListName(args: { id: number; name: string }): Promise<void>
    removeList(args: { id: number }): Promise<any>
    removePageFromList(args: { id: number; url: string }): Promise<void>
    fetchAllLists(args: {
        excludeIds?: number[]
        skip?: number
        limit?: number
        skipMobileList?: boolean
    }): Promise<PageList[]>
    fetchListById(args: { id: number }): Promise<PageList>
    fetchListPagesByUrl(args: { url: string }): Promise<PageList[]>
    fetchInitialListSuggestions(args?: { limit?: number }): Promise<string[]>
    fetchListNameSuggestions(args: {
        name: string
        url: string
    }): Promise<PageList[]>
    fetchListPagesById(args: { id: number }): Promise<PageListEntry[]>
    fetchListIgnoreCase(args: { name: string }): Promise<PageList[]>
    addOpenTabsToList(args: { listId: number; tabs?: Tab[] }): Promise<void>
    removeOpenTabsFromList(args: {
        listId: number
        tabs?: Tab[]
    }): Promise<void>
}

export interface CollectionsSettings {
    suggestions?: string[]
}
