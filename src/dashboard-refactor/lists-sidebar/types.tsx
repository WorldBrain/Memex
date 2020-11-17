import { ListsSidebarGroupProps } from './components/lists-sidebar-group'

export interface ListsSidebarProps {
    sidebarLockedState: SidebarLockedState
    sidebarPeekState: SidebarPeekState
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
