import { Browser } from 'webextension-polyfill-ts'
import { UIEvent } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'

import {
    RootState as SearchResultsState,
    Events as SearchResultEvents,
    NoteDataEventArgs,
    PageEventArgs,
} from './search-results/types'
import {
    RootState as ListsSidebarState,
    Events as ListsSidebarEvents,
} from './lists-sidebar/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { SearchInterface } from 'src/search/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { SearchFilterType } from './header/types'
import { Analytics } from 'src/analytics'

export interface RootState {
    loadState: TaskState
    searchResults: SearchResultsState
    searchFilters: SearchFiltersState
    listsSidebar: ListsSidebarState
    modals: DashboardModalsState
}

export type Events = UIEvent<
    DashboardModalsEvents &
        SearchResultEvents &
        SearchFilterEvents &
        ListsSidebarEvents & {
            search: { paginate?: boolean }
            example: null
        }
>

export interface DashboardDependencies {
    analytics: Analytics
    tagsBG: RemoteTagsInterface
    authBG: AuthRemoteFunctionsInterface
    contentShareBG: ContentSharingInterface
    listsBG: RemoteCollectionsInterface
    searchBG: SearchInterface
    annotationsBG: AnnotationInterface<'caller'>
    copyToClipboard: (text: string) => Promise<boolean>
    localStorage: Browser['storage']['local']
}

export interface DropReceivingState {
    isDraggedOver?: boolean
    canReceiveDroppedItems?: boolean
    triggerSuccessfulDropAnimation?: boolean
    onDragOver(id: number): void
    onDragLeave(id: number): void
    onDrop(id: number): void
}

export interface SearchResultTextPart {
    text: string
    match: boolean
}

export interface HoverState {
    onHoverEnter(id: number): void
    onHoverLeave(id: number): void
    isHovered: boolean
}

export interface SelectedState {
    onSelection(id: number): void
    isSelected: boolean
}

export interface DisplayState {
    isDisplayed: boolean
    toggleDisplayState: () => void
}

export interface DashboardModalsState {
    shareListId?: number
    showBetaFeature?: boolean
    showSubscription?: boolean
    showNoteShareOnboarding?: boolean

    deletingListId?: number
    deletingPageArgs?: PageEventArgs
    deletingNoteArgs?: NoteDataEventArgs
}

export type DashboardModalsEvents = UIEvent<{
    setShareListId: { listId?: number }
    setShowBetaFeatureModal: { isShown: boolean }
    setShowSubscriptionModal: { isShown: boolean }
    setShowNoteShareOnboardingModal: { isShown: boolean }

    setDeletingListId: { listId: number }
    setDeletingPageArgs: PageEventArgs
    setDeletingNoteArgs: NoteDataEventArgs
}>

export type ListSource = 'local-lists' | 'followed-list'

// TODO: move this into the filter's dir once merged in
export interface SearchFiltersState {
    searchQuery: string
    isSearchBarFocused: boolean
    searchFiltersOpen: boolean
    isTagFilterActive: boolean
    isDateFilterActive: boolean
    isDomainFilterActive: boolean

    dateFromInput: string
    dateToInput: string
    dateFrom?: number
    dateTo?: number

    tagsIncluded: string[]
    tagsExcluded: string[]
    tagPickerQuery: string
    domainsIncluded: string[]
    domainsExcluded: string[]
    domainPickerQuery: string

    limit: number
    skip: number
}

export type SearchFilterEvents = UIEvent<{
    setSearchQuery: { query: string }
    setSearchBarFocus: { isFocused: boolean }

    setSearchFiltersOpen: { isOpen: boolean }
    setTagFilterActive: { isActive: boolean }
    setDateFilterActive: { isActive: boolean }
    setDomainFilterActive: { isActive: boolean }

    setDateFromInputValue: { value: string; searchQuery: string }
    setDateToInputValue: { value: string; searchQuery: string }
    setDateFrom: { value: number; searchQuery: string }
    setDateTo: { value: number; searchQuery: string }

    addIncludedTag: { tag: string; searchQuery: string }
    delIncludedTag: { tag: string; searchQuery: string }
    addExcludedTag: { tag: string; searchQuery: string }
    delExcludedTag: { tag: string; searchQuery: string }

    addIncludedDomain: { domain: string; searchQuery: string }
    delIncludedDomain: { domain: string; searchQuery: string }
    addExcludedDomain: { domain: string; searchQuery: string }
    delExcludedDomain: { domain: string; searchQuery: string }

    setTagsIncluded: { tags: string[]; searchQuery: string }
    setTagsExcluded: { tags: string[]; searchQuery: string }
    setDomainsIncluded: { domains: string[]; searchQuery: string }
    setDomainsExcluded: { domains: string[]; searchQuery: string }

    setTagPickerQuery: { value: string }
    setDomainPickerQuery: { value: string }

    resetFilters: null
}>

export interface NewItemsCountState {
    displayNewItemsCount: boolean
    newItemsCount: number
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

export type ParsedSearchQuery = SearchQueryPart[]

export type SearchQueryPart = QueryFilterPart | QueryStringPart | undefined

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

export type NewFilterDetail =
    | Omit<TextFilterDetail, 'rawContent'>
    | Omit<DateFilterDetail, 'rawContent'>

export interface TextFilterDetail {
    type: SearchFilterType
    rawContent: string
    filters: string[]
    query?: string
    isExclusion?: boolean
}

export type DatePickerVariant = 'from' | 'to'

type DateFilterDetail = Omit<TextFilterDetail, 'type' | 'variant'> & {
    type: 'date'
    variant: DatePickerVariant
}

interface PickerState {
    included?: string[]
    excluded?: string[]
    query?: string
    variant?: DatePickerVariant
}

// I want the keys of this object to depend on the SearchFilterType
export interface AllPickersState {
    tag: PickerState
    domain: PickerState
    date: PickerState
}
