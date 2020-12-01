import { UIEvent } from 'ui-logic-core'

import {
    RootState as SearchResultsState,
    Events as SearchResultEvents,
} from './search-results/types'

export interface RootState {
    searchResults: SearchResultsState
}

export type Events = UIEvent<SearchResultEvents & { example: null }>

export interface DashboardDependencies {}

export interface NewItemsCountState {
    displayNewItemsCount: boolean
    newItemsCount: number
}

export interface DropReceivingState {
    canReceiveDroppedItems: boolean // this defines whether items can be dropped (not whether there is a state change on drag-over)
    isDraggedOver: boolean
    triggerSuccessfulDropAnimation: boolean
    onDragOver(normalizedPageUrl: string): void
    onDragLeave(normalizedPageUrl: string): void
    onDrop(normalizedPageUrl: string): void
}

export interface SearchResultTextPart {
    text: string
    match: boolean
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
