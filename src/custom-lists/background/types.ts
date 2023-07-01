import type { SharedCollectionType } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import type {
    SharedAnnotation,
    SharedAnnotationReference,
    SharedList,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { UnifiedList } from 'src/annotations/cache/types'

export interface PageList {
    id: number
    name: string
    remoteId?: string
    description?: string
    pages?: string[]
    createdAt: Date
    isNestable?: boolean
    isDeletable?: boolean
    isOwned?: boolean
    active?: boolean
    type?: SharedCollectionType
}

export interface PageListEntry {
    pageUrl: string
    createdAt: Date
    listId: number
    fullUrl: string
}

export type SharedListWithAnnotations = SharedList & {
    creator: UserReference
    sharedAnnotations: Array<
        SharedAnnotation & {
            creator: UserReference
            reference: SharedAnnotationReference
        }
    >
}

export interface ListDescription {
    listId: number
    description: string
}

export interface SharedAnnotationList {
    id: string
    name: string
    creatorReference: UserReference
    sharedAnnotationReferences: SharedAnnotationReference[]
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
    createCustomList(args: {
        name: string
        id?: number
        type?: 'page-link'
        createdAt?: Date
    }): Promise<number>
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
    fetchListDescriptions(args: {
        listIds: number[]
    }): Promise<{ [listId: number]: string | null }>
    updateListDescription(args: {
        listId: number
        description: string
    }): Promise<void>
    removeList(args: { id: number }): Promise<any>
    removePageFromList(args: { id: number; url: string }): Promise<void>
    fetchAllFollowedLists(args: {
        skip?: number
        limit?: number
    }): Promise<PageList[]>
    fetchSharedListDataWithOwnership(args: {
        remoteListId: string
    }): Promise<PageList | null>
    fetchSharedListDataWithPageAnnotations(args: {
        remoteListId: string
        normalizedPageUrl: string
    }): Promise<SharedListWithAnnotations | null>
    fetchLocalDataForRemoteListEntryFromServer(args: {
        remoteListId: string
        normalizedPageUrl: string
        opts: {
            needAnnotsFlag?: boolean
            needLocalListd?: boolean
        }
    }): Promise<{
        hasAnnotationsFromOthers?: boolean
        localListId?: number
        sharedListEntryId: string
    } | null>
    fetchCollaborativeLists(args: {
        skip?: number
        limit?: number
    }): Promise<PageList[]>
    fetchAnnotationRefsForRemoteListsOnPage(args: {
        sharedListIds: string[]
        normalizedPageUrl: string
    }): Promise<{
        [sharedListId: string]: SharedAnnotationReference[]
    }>
    fetchFollowedListsWithAnnotations(args: {
        normalizedPageUrl: string
    }): Promise<SharedAnnotationList[]>
    fetchAllLists(args: {
        skip?: number
        limit?: number
        skipSpecialLists?: boolean
        includeDescriptions?: boolean
    }): Promise<PageList[]>
    fetchListById(args: { id: number }): Promise<PageList>
    fetchListByName(args: { name: string }): Promise<PageList>
    fetchListPagesByUrl(args: { url: string }): Promise<PageList[]>
    fetchInitialListSuggestions(args?: {
        /** Set this to factor in fetching of extra entries that might not be in the recently used suggestion store. */
        extraListIds?: number[]
    }): Promise<Pick<UnifiedList, 'localId' | 'name' | 'remoteId'>[]>
    fetchListPagesById(args: { id: number }): Promise<PageListEntry[]>
    fetchPageLists(args: { url: string }): Promise<number[]>
    fetchListIdsByUrl(args: { url: string }): Promise<number[]>
    fetchListIgnoreCase(args: { name: string }): Promise<PageList[]>
    searchForListSuggestions(args: {
        query: string
        limit?: number
    }): Promise<Array<Omit<PageList, 'createdAt'> & { createdAt: number }>>
    addOpenTabsToList(args: { listId: number; time?: number }): Promise<void>
    removeOpenTabsFromList(args: { listId: number }): Promise<void>
    updateListForPage(args: {
        added?: number
        deleted?: number
        url: string
        tabId?: number
        skipPageIndexing?: boolean
    }): Promise<void>
    getInboxUnreadCount(): Promise<number>
}

export interface CollectionsSettings {
    suggestions?: string[]
    suggestionIds: number[]
}
