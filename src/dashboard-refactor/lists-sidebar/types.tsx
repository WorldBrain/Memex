import { ListsSidebarSearchBarProps } from './components/lists-search-bar'
import { ListsSidebarGroupProps } from './components/lists-sidebar-group'

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
