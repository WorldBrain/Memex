import type { UIEvent } from 'ui-logic-core'
import type { ListsSidebarSearchBarProps } from './components/search-bar'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'

export interface ListTreeInteractions {
    hasChildren: boolean
    isTreeToggled: boolean
    isNestedListInputShown: boolean
    newNestedListCreateState: TaskState
}

export type RootState = Pick<ListsSidebarSearchBarProps, 'searchQuery'> & {
    lists: NormalizedState<
        UnifiedList & {
            wasPageDropped?: boolean
            wasListDropped?: boolean
        }
    >
    listTrees: NormalizedState<ListTreeInteractions>
    filteredListIds: UnifiedList['unifiedId'][]
    areLocalListsExpanded: boolean
    areFollowedListsExpanded: boolean
    areJoinedListsExpanded: boolean
    isAddListInputShown: boolean
    spaceSidebarWidth: string
    disableMouseLeave: boolean

    draggedListId: string | null
    inboxUnreadCount: number
    dragOverListId?: string
    editingListId?: string
    selectedListId: string | null
    showMoreMenuListId?: string
    editMenuListId?: string
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
    listDropReceiveState: TaskState
    listShareLoadingState: TaskState
    themeVariant: MemexThemeVariant
}

export type Events = UIEvent<{
    setSidebarLocked: { isLocked: boolean }
    setSidebarPeeking: { isPeeking: boolean }
    setSidebarToggleHovered: { isHovered: boolean }
    setListQueryValue: { query: string }

    setAddListInputShown: { isShown: boolean }
    cancelListCreate: null
    confirmListCreate: { value: string }

    setLocalListsExpanded: { isExpanded: boolean }
    setFollowedListsExpanded: { isExpanded: boolean }
    setJoinedListsExpanded: { isExpanded: boolean }

    setListPrivacy: { listId: string; isPrivate: boolean }
    confirmListEdit: { value: string; listId: string; skipDBOps?: boolean }
    cancelListEdit: null
    updatePageTitle: {
        normalizedPageUrl: string
        changedTitle: string
        day: number
        pageId: string
    }
    updatePageTitleState: {
        normalizedPageUrl: string
        changedTitle: string
        day: number
        pageId: string
    }
    setDragOverListId: { listId?: string }
    setEditingListId: { listId: string }
    setSelectedListId: { listId: string }
    setShowMoreMenuListId: { listId: string }
    setEditMenuListId: { listId: string }
    dropOnListItem: { listId: string; dataTransfer: DataTransfer }
    dragList: { listId: string; dataTransfer: DataTransfer }
    dropList: { listId: string }

    // Tree-related events
    toggleListTreeShow: { listId: string }
    toggleNestedListInputShow: { listId: string }
    createdNestedList: { parentListId: string; name: string }

    confirmListDelete: null
    cancelListDelete: null

    updateSelectedListDescription: { description: string }
    toggleTheme: null
    switchToFeed: null
}>

export type DragToListAction<T extends 'page' | 'list'> = T extends 'page'
    ? {
          type: 'page'
          fullPageUrl: string
          normalizedPageUrl: string
      }
    : {
          type: 'list'
          listId: string
      }

export type ListNameHighlightIndices = [number, number]
