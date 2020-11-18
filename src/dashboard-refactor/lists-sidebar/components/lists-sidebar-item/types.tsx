import {
    DroppableState,
    HoverState,
    NewItemsCountState,
    SelectedState,
} from 'src/dashboard-refactor/types'

export interface MoreActionButtonState {
    onMoreActionClick(normalizedPageUrl: string): void
    displayMoreActionButton: boolean
}

export interface ListsSidebarItemProps {
    className?: string
    listName: string
    isEditing: boolean
    hoverState: HoverState
    selectedState: SelectedState
    droppableState: DroppableState
    newItemsCountState: NewItemsCountState
    moreActionButtonState: MoreActionButtonState
}
