export interface HoverState {
    onHoverEnter(): void
    onHoverLeave(): void
    isHovered: boolean
}

export interface SelectedState {
    onSelection(): void
    isSelected: boolean
}
