import type { UIEvent } from 'ui-logic-core'
import type { ListsSidebarSearchBarProps } from './components/search-bar'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'

export interface ListData {
    id: number
    name: string
    newName?: string
    remoteId?: string
    description?: string
    isOwnedList?: boolean
    isJoinedList?: boolean
    wasPageDropped?: boolean
}

export interface ListGroupCommon {
    isExpanded: boolean
    allListIds: string[]
    filteredListIds: string[] | null
}

export interface FollowedListGroup extends ListGroupCommon {}

export interface LocalListGroup extends ListGroupCommon {
    isAddInputShown: boolean
}

export type RootState = Pick<ListsSidebarSearchBarProps, 'searchQuery'> & {
    lists: PageAnnotationsCacheInterface['lists']
    listData: { [id: number]: ListData }
    followedLists: FollowedListGroup
    localLists: LocalListGroup
    joinedLists: ListGroupCommon
    spaceSidebarWidth: number

    inboxUnreadCount: number
    dragOverListId?: string
    editingListId?: string
    selectedListId?: string
    showMoreMenuListId?: string
    isSidebarToggleHovered?: boolean
    hasFeedActivity: boolean
    isSidebarLocked: boolean
    isSidebarPeeking: boolean
    addListErrorMessage: string | null
    editListErrorMessage: string | null

    listLoadState: TaskState
    listEditState: TaskState
    listDeleteState: TaskState
    listCreateState: TaskState
    listShareLoadingState: TaskState
    showFeed?: boolean
}

export type Events = UIEvent<{
    setSidebarLocked: { isLocked: boolean }
    setSidebarPeeking: { isPeeking: boolean }
    setSidebarToggleHovered: { isHovered: boolean }
    setListQueryValue: { query: string }

    setAddListInputShown: { isShown: boolean }
    cancelListCreate: null
    confirmListCreate: { value: string }

    setLocalLists: { lists: ListData[] }
    setFollowedLists: { lists: ListData[] }
    setLocalListsExpanded: { isExpanded: boolean }
    setFollowedListsExpanded: { isExpanded: boolean }
    setJoinedListsExpanded: { isExpanded: boolean }

    changeListName: { value: string; listId?: number }
    confirmListEdit: { value: string; listId?: number }
    cancelListEdit: null
    setDragOverListId: { listId?: number }
    setEditingListId: { listId: number }
    setSelectedListId: { listId: number }
    setShowMoreMenuListId: { listId: number }
    dropPageOnListItem: { listId: number; dataTransfer: DataTransfer }
    shareList: { listId: number }
    setListRemoteId: { localListId: number; remoteListId: string }

    confirmListDelete: null
    cancelListDelete: null

    updateSelectedListDescription: { description: string }

    clickFeedActivityIndicator: null
    switchToFeed: null
}>

export type ListNameHighlightIndices = [number, number]
