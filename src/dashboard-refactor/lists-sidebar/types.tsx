import { UIEvent } from 'ui-logic-core'

import { ListsSidebarSearchBarProps } from './components/lists-search-bar'
import { ListsSidebarGroupProps } from './components/lists-sidebar-group'
import { TaskState } from 'ui-logic-core/lib/types'

export interface ListsSidebarProps {
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

export interface ListGroup
    extends Pick<ListsSidebarGroupProps, 'loadingState'> {
    isExpanded: boolean
    isAddInputShown: boolean
    addInputValue: string
    listIds: number[]
}

export type RootState = Pick<SidebarLockedState, 'isSidebarLocked'> &
    Pick<SidebarPeekState, 'isSidebarPeeking'> &
    Pick<ListsSidebarSearchBarProps, 'searchQuery'> & {
        listData: { [id: number]: ListData }
        followedLists: Omit<ListGroup, 'isAddInputShown' | 'addInputValue'>
        newListCreateState: TaskState
        localLists: ListGroup
        selectedListId?: number
    }

export type Events = UIEvent<{
    setSidebarLocked: { isLocked: boolean }
    setSidebarPeeking: { isPeeking: boolean }
    setListQueryValue: { value: string }

    setAddListInputShown: { isShown: boolean }
    setAddListInputValue: { value: string }
    addNewList: null

    setLocalLists: { lists: ListData[] }
    setFollowedLists: { lists: ListData[] }
    setLocalListsExpanded: { isExpanded: boolean }
    setFollowedListsExpanded: { isExpanded: boolean }

    setSelectedListId: { listId: number }
}>
