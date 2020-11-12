export interface NewItemsCountState {
    displayNewItemsCount: boolean
    newItemsCount: number
}

export interface DroppableState {
    isDroppable: boolean // this defines whether items can be dropped (not whether there is a state change on drag-over)
    isDraggedOver: boolean
    isBlinking: boolean
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
