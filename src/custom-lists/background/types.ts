import type { LoadPageAnnotationRefsForListsResult } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import type { SharedCollectionType } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import type {
    SharedAnnotation,
    SharedAnnotationReference,
    SharedList,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { Orderable } from '@worldbrain/memex-common/lib/utils/item-ordering'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { ListShareResult } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { SuggestionCard } from 'src/sidebar/annotations-sidebar/containers/types'

export interface PageList extends Orderable {
    id: number
    name: string
    remoteId?: string
    description?: string
    pages?: string[]
    createdAt: Date
    pathListIds: number[]
    parentListId: number | null
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

export interface ListTree {
    id: number
    listId: number | null
    linkTarget: number | null
    /** A materialized path, containing IDs of all ancestors of this tree delimited by comma in order from oldest to youngest. e.g., "a,b,c" */
    path: string
    parentListId: number | null
    order: number
    createdWhen: number
    updatedWhen: number
}

export type SharedListWithAnnotations = SharedList &
    Orderable & {
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
    updateListTreeParent(args: {
        localListId: number
        parentListId: number | null
        now?: number
    }): Promise<void>
    updateListTreeOrder(args: {
        localListId: number
        intendedIndexAmongSiblings: number
        siblingListIds: number[]
        now?: number
    }): Promise<void>
    deleteListTree(args: { treeId: number }): Promise<void>
    createCustomList(
        args: {
            name: string
            id?: number
            order?: number
            parentListId?: number
            createdAt?: Date
            dontTrack?: boolean
        } & (
            | {
                  type?: never
              }
            | {
                  /** If set, list + key IDs are expected to be pre-generated and supplied. */
                  type: 'page-link'
                  collabKey: string
                  remoteListId: string
              }
        ),
    ): Promise<
        ListShareResult & {
            localListId: number
        }
    >
    insertPageToList(args: {
        id: number
        url: string
        tabId?: number
        skipPageIndexing?: boolean
        suppressVisitCreation?: boolean
        pageTitle?: string
        indexUrl?: boolean
    }): Promise<{ object: PageListEntry }>
    updateListName(args: {
        id: number
        oldName: string
        newName: string
    }): Promise<void>
    findPageByUrl(normalizedUrl: string): Promise<void>
    fetchListDescriptions(args: {
        listIds: number[]
    }): Promise<{ [listId: number]: string | null }>
    updateListDescription(args: {
        listId: number
        description: string
    }): Promise<void>
    removePageFromList(args: { id: number; url: string }): Promise<void>
    removeAllListPages(listId: number): Promise<void>
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
    fetchAnnotationRefsForRemoteListsOnPage(args: {
        sharedListIds: string[]
        normalizedPageUrl: string
    }): Promise<LoadPageAnnotationRefsForListsResult>
    fetchAllLists(args: {
        skip?: number
        limit?: number
        includeTreeData?: boolean
        skipSpecialLists?: boolean
        includeDescriptions?: boolean
    }): Promise<PageList[]>
    fetchListById(args: { id: number }): Promise<PageList>
    fetchListTreeById(args: { id: number }): Promise<PageList>
    findSimilarBackground(
        currentPageContent?: string,
        fullUrl?: string,
    ): Promise<SuggestionCard[]>
    fetchListPagesByUrl(args: { url: string }): Promise<PageList[]>
    fetchPageListEntriesByUrl(args: { url: string }): Promise<PageListEntry[]>
    fetchPageLists(args: { url: string }): Promise<number[]>
    addOpenTabsToList(args: { listId: number; time?: number }): Promise<void>
    removeOpenTabsFromList(args: { listId: number }): Promise<void>
    updateListForPage(args: {
        added?: number
        deleted?: number
        url: string
        tabId?: number
        skipPageIndexing?: boolean
        pageTitle?: string
    }): Promise<void>
    getInboxUnreadCount(): Promise<number>
    createTabGroup(listId: number): Promise<void>
}

export interface CollectionsSettings {
    suggestions?: string[]
    suggestionIds: number[]
}
