export interface NewItemsCountState {
    displayNewItemsCount: boolean
    newItemsCount: number
}

export interface DroppableState {
    isDroppable: boolean // this defines whether items can be dropped (not whether there is a state change on drag-over)
    isDraggedOver: boolean
    isBlinking: boolean
    onDragOver(normalizedPageUrl: string): void
    onDragLeave(normalizedPageUrl: string): void
    onDrop(normalizedPageUrl: string): void
}

export interface ExpandableState {
    isExpandable: boolean
    isExpanded: boolean
    onExpand(listSrouce: ListSource): void
}

export interface AddableState {
    isAddable: boolean
    onAdd(listSource: ListSource): void
}

export interface HoverState {
    onHoverEnter(normalizedPageUrl: string): void
    onHoverLeave(normalizedPageUrl: string): void
    isHovered: boolean
}

export interface SelectedState {
    onSelection(normalizedPageUrl: string): void
    isSelected: boolean
}

export type ListSource = 'local-lists' | 'followed-list'
