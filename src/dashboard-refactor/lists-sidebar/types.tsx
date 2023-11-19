import type { UIEvent } from 'ui-logic-core'
import type { ListsSidebarSearchBarProps } from './components/search-bar'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export type RootState = Pick<ListsSidebarSearchBarProps, 'searchQuery'> & {
    lists: NormalizedState<UnifiedList & { wasPageDropped?: boolean }>
    filteredListIds: UnifiedList['unifiedId'][]
    areLocalListsExpanded: boolean
    areFollowedListsExpanded: boolean
    areJoinedListsExpanded: boolean
    isAddListInputShown: boolean
    spaceSidebarWidth: number

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
    setDragOverListId: { listId?: string }
    setEditingListId: { listId: string }
    setSelectedListId: { listId: string }
    setShowMoreMenuListId: { listId: string }
    setEditMenuListId: { listId: string }
    dropPageOnListItem: { listId: string; dataTransfer: DataTransfer }

    confirmListDelete: null
    cancelListDelete: null

    updateSelectedListDescription: { description: string }
    toggleTheme: { themeVariant: MemexThemeVariant }
    switchToFeed: null
}>

export type ListNameHighlightIndices = [number, number]
