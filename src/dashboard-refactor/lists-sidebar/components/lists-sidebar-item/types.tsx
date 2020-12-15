import {
    DropReceivingState,
    HoverState,
    NewItemsCountState,
    SelectedState,
} from 'src/dashboard-refactor/types'

export interface MoreActionButtonState {
    onMoreActionClick(normalizedPageUrl: string): void
    displayMoreActionButton?: boolean
}

export type ListNameHighlightIndices = [number, number]

export interface ListsSidebarItemCommonProps {
    className?: string
    name: string
    isEditing: boolean
    newItemsCountState: NewItemsCountState
    nameHighlightIndices?: ListNameHighlightIndices
}

export interface ListsSidebarItemProps extends ListsSidebarItemCommonProps {
    hoverState: HoverState
    selectedState: SelectedState
    dropReceivingState: DropReceivingState
    moreActionButtonState: MoreActionButtonState
}

// this type is differentiated from the type which governs the object passed down the tree to its parent:
// the click handlers in this type have received their parameters from the parent and so receive none
export interface ListsSidebarItemComponentProps
    extends ListsSidebarItemCommonProps {
    hoverState: HoverComponentState
    selectedState: SelectedComponentState
    dropReceivingState: DropReceivingComponentState
    moreActionButtonState: MoreActionButtonComponentState
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
    onMoreActionClick(): void
    displayMoreActionButton?: boolean
}
