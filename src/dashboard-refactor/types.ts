import { SearchFilterType } from './header/types'

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

export interface CursorLocationState {
    location: number
    onCursorLocationChange: (event: { location: number }) => void
}

export type ListSource = 'local-lists' | 'followed-list'

export type ParsedSearchQuery = (
    | QueryFilterPart
    | QueryStringPart
    | undefined
)[]

export interface QueryStringPart {
    type: 'searchString'
    startIndex: number
    endIndex: number
    detail: { value: string }
}

export interface QueryFilterPart {
    type: 'filter'
    startIndex: number
    endIndex: number
    detail: SearchFilterDetail
}

export type SearchFilterDetail = TextFilterDetail | DateFilterDetail

export interface TextFilterDetail {
    type: SearchFilterType
    rawContent: string
    filters: string[]
    query?: string
    isExclusion?: boolean
    variant?: undefined
}

type DateFilterDetail = Omit<TextFilterDetail, 'type' | 'variant'> & {
    type: 'date'
    variant: 'from' | 'to'
}

export type FilterMutationDetail =
    | Omit<SearchFilterDetail, 'rawContent'>
    | Omit<DateFilterDetail, 'rawContent'>
