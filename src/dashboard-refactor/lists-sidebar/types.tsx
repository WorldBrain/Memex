import { UIEvent } from 'ui-logic-core'

import { ListsSidebarSearchBarProps } from './components/lists-search-bar'
import { ListsSidebarGroupProps } from './components/lists-sidebar-group'
import { TaskState } from 'ui-logic-core/lib/types'

export interface ListsSidebarProps {
    onListSelection: (id: number) => void
    selectedListId?: number
    lockedState: SidebarLockedState
    peekState: SidebarPeekState
    searchBarProps: ListsSidebarSearchBarProps
    listsGroups: ListsSidebarGroupProps[]
}

export interface SidebarLockedState {
    toggleSidebarLockedState(): void
    isSidebarLocked: boolean
}

export interface SidebarPeekState {
    toggleSidebarPeekState(): void
    isSidebarPeeking: boolean
}

export interface ListData {
    id: number
    name: string
}

export interface ListGroupCommon
    extends Pick<ListsSidebarGroupProps, 'loadingState'> {
    isExpanded: boolean
    listIds: number[]
}

export interface FollowedListGroup extends ListGroupCommon {}

export interface LocalListGroup extends ListGroupCommon {
    isAddInputShown: boolean
    addInputValue: string
}

export type RootState = Pick<SidebarLockedState, 'isSidebarLocked'> &
    Pick<SidebarPeekState, 'isSidebarPeeking'> &
    Pick<ListsSidebarSearchBarProps, 'searchQuery'> & {
        listData: { [id: number]: ListData }
        followedLists: FollowedListGroup
        localLists: LocalListGroup
        newListCreateState: TaskState

        editingListId?: number
        selectedListId?: number
        showMoreMenuListId?: number
    }

export type Events = UIEvent<{
    setSidebarLocked: { isLocked: boolean }
    setSidebarPeeking: { isPeeking: boolean }
    setListQueryValue: { query: string }

    setAddListInputShown: { isShown: boolean }
    setAddListInputValue: { value: string }
    addNewList: null

    setLocalLists: { lists: ListData[] }
    setFollowedLists: { lists: ListData[] }
    setLocalListsExpanded: { isExpanded: boolean }
    setFollowedListsExpanded: { isExpanded: boolean }

    setEditingListId: { listId: number }
    setSelectedListId: { listId: number }
    setShowMoreMenuListId: { listId: number }
}>
