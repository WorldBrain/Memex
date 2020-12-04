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

// TODO: move this into the filter's dir once merged in
export interface FiltersState {
    searchQuery: string
    isSearchBarFocused: boolean
    searchFiltersOpen: boolean
    isTagFilterActive: boolean
    isDateFilterActive: boolean
    isDomainFilterActive: boolean

    dateFromInput?: string
    dateToInput?: string
    dateFrom?: number
    dateTo?: number

    tagsIncluded: string[]
    tagsExcluded: string[]
    domainsIncluded: string[]
    domainsExcluded: string[]
}

export type FilterEvents = UIEvent<{
    setSearchQuery: { query: string }
    setSearchBarFocused: { isFocused: boolean }

    setSearchFiltersOpen: { isOpen: boolean }
    setTagFilterActive: { isActive: boolean }
    setDateFilterActive: { isActive: boolean }
    setDomainFilterActive: { isActive: boolean }

    setDateFromInputValue: { value: string }
    setDateToInputValue: { value: string }
    setDateFrom: { value: number }
    setDateTo: { value: number }

    addIncludedTag: { tag: string }
    delIncludedTag: { tag: string }
    addIncludedDomain: { tag: string }
    delIncludedDomain: { tag: string }
    setTagsIncluded: { tags: string[] }
    setTagsExcluded: { tags: string[] }
    setDomainsIncluded: { domains: string[] }
    setDomainsExcluded: { domains: string[] }

    resetFilters: null
}>
