export type ListNameHighlightIndices = [number, number]

export interface ListsSidebarItemCommonProps {
    className?: string
    name: string
    isEditing?: boolean
    newItemsCount?: number
    nameHighlightIndices?: ListNameHighlightIndices
}

// this type is differentiated from the type which governs the object passed down the tree to its parent:
// the click handlers in this type have received their parameters from the parent and so receive none
export interface ListsSidebarItemComponentProps
    extends ListsSidebarItemCommonProps {
    hoverState: HoverComponentState
    selectedState: SelectedComponentState
    dropReceivingState?: DropReceivingComponentState
    onMoreActionClick?: () => void
}

interface HoverComponentState {
    onHoverEnter(): void
    onHoverLeave(): void
    isHovered: boolean
}

interface SelectedComponentState {
    onSelection(): void
    isSelected: boolean
}

export interface DropReceivingComponentState {
    onDragOver(): void
    onDragLeave(): void
    onDrop(): void
    isDraggedOver?: boolean
    canReceiveDroppedItems?: boolean
    triggerSuccessfulDropAnimation?: boolean
}

interface MoreActionButtonComponentState {
    displayMoreActionButton?: boolean
}
