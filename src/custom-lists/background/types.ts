export interface PageList {
    id: number
    name: string
    description?: string
    pages?: string[]
    isFollowed?: boolean
    isCollaborative?: boolean
    isNestable?: boolean
    isDeletable?: boolean
    active?: boolean
}

export interface PageListEntry {
    pageUrl: string
    createdAt: Date
    listId: number
    fullUrl: string
}

export interface Tab {
    tabId: number
    url: string
}

export interface CollectionStatus {
    isOwn: boolean
    isCollaborative: boolean
}

export interface CollectionsCacheInterface {
    addCollection: (collection: PageList) => void
    addCollections: (collections: PageList[]) => void
    removeCollection: (id: number) => void
    getCollectionStatus: (id: number) => CollectionStatus | null
    getCollectionsByStatus: (status: CollectionStatus) => PageList[]
}

export interface RemoteCollectionsInterface {
    createCustomList(args: { name: string }): Promise<number>
    insertPageToList(args: {
        id: number
        url: string
        tabId?: number
        skipPageIndexing?: boolean
        suppressVisitCreation?: boolean
    }): Promise<{ object: PageListEntry }>
    updateListName(args: {
        id: number
        oldName: string
        newName: string
    }): Promise<void>
    updateListDescription(args: {
        listId: number
        description: string
    }): Promise<void>
    removeList(args: { id: number }): Promise<any>
    removePageFromList(args: { id: number; url: string }): Promise<void>
    fetchAllLists(args: {
        skip?: number
        limit?: number
        skipMobileList?: boolean
    }): Promise<PageList[]>
    fetchListById(args: { id: number }): Promise<PageList>
    fetchListPagesByUrl(args: { url: string }): Promise<PageList[]>
    fetchInitialListSuggestions(args?: { limit?: number }): Promise<string[]>
    fetchCollaborativeListNames(args?: { limit?: number }): Promise<string[]>
    fetchListPagesById(args: { id: number }): Promise<PageListEntry[]>
    fetchPageLists(args: { url: string }): Promise<string[]>
    fetchListIdsByUrl(args: { url: string }): Promise<number[]>
    fetchListIgnoreCase(args: { name: string }): Promise<PageList[]>
    searchForListSuggestions(args: {
        query: string
        limit?: number
    }): Promise<string[]>
    addOpenTabsToList(args: {
        name: string
        listId?: number
        time?: number
    }): Promise<void>
    removeOpenTabsFromList(args: { listId: number }): Promise<void>
    updateListForPage(args: {
        added?: string
        deleted?: string
        url: string
        tabId?: number
        skipPageIndexing?: boolean
    }): Promise<void>
    getInboxUnreadCount(): Promise<number>
}

export interface CollectionsSettings {
    suggestions?: string[]
}
