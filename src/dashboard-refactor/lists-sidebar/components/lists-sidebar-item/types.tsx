import {
    DropReceivingState,
    HoverState,
    NewItemsCountState,
    SelectedState,
    SearchResultTextPart,
} from 'src/dashboard-refactor/types'

export interface MoreActionButtonState {
    onMoreActionClick(normalizedPageUrl: string): void
    displayMoreActionButton: boolean
}

export interface ListsSidebarItemProps {
    className?: string
    listName: SearchResultTextPart[] | string
    isEditing: boolean
    hoverState: HoverState
    selectedState: SelectedState
    dropReceivingState: DropReceivingState
    newItemsCountState: NewItemsCountState
    moreActionButtonState: MoreActionButtonState
}

// this type is differentiated from the type which governs the object passed down the tree to its parent:
// the click handlers in this type have received their parameters from the parent and so receive none
export interface ListsSidebarItemComponentProps {
    className?: string
    listName: SearchResultTextPart[] | string
    isEditing: boolean
    hoverState: HoverComponentState
    selectedState: SelectedComponentState
    dropReceivingState: DropReceivingComponentState
    newItemsCountState: NewItemsCountState
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
    triggerSuccessfulDropAnimation: boolean
    isDraggedOver: boolean
    canReceiveDroppedItems: boolean
}

interface MoreActionButtonComponentState {
    onMoreActionClick(): void
    displayMoreActionButton
}
