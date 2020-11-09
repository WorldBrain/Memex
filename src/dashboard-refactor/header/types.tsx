export interface HoverState {
    onHoverEnter(): void
    onHoverLeave(): void
    isHovered: boolean
}

export interface SidebarLockedState {
    onSidebarToggleClick(): void
    isSidebarLocked: boolean
}
