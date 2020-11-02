export interface SidebarLockedState {
    toggleSidebarLockedState(): void
    isSidebarLocked: boolean
}

export interface SidebarPeekState {
    toggleSidebarPeekState(): void
    isSidebarPeeking: boolean
}
