export interface ReceivesDraggableItemsState {
    isDroppable: boolean // this defines whether items can be dropped (not whether there is a state change on drag-over)
    onDragOver(): void
    onDragLeave(): void
    onDrop(): void
}

export interface HoverState {
    onHoverEnter(): void
    onHoverLeave(): void
    isHovered: boolean
}

export interface SelectedState {
    onSelection(): void
    isSelected: boolean
}
