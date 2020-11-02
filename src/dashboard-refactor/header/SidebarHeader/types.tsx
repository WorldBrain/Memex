export interface SidebarToggleProps {
    sidebarLockedState: SidebarLockedState
    sidebarToggleHoverState: SidebarToggleHoverState
}

export interface SidebarToggleHoverState {
    onHoverEnter(): void
    onHoverLeave(): void
    isHovered: boolean
}

export interface SidebarLockedState {
    toggleSidebarLockedState(): void
    isSidebarLocked: boolean
}

export interface SidebarPeekState {
    toggleSidebarPeekState(): void
    isSidebarPeeking: boolean
}
