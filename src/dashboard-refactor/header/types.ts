import { UIEvent } from 'ui-logic-core'

export type SyncStatusIconState = 'green' | 'yellow' | 'red'

export type FilterKey = 't' | 'd' | 'c' | '-t' | '-d' | '-c' | 'from' | 'to'

export type SearchQueryParsed = SearchQueryPart[]

export interface SearchQueryPart {
    type: 'filter' | 'search terms'
    detail?: SearchFilterDetail | string
}

export interface SearchFilterDetail {
    filterType: FilterList
    filters: string[]
}

export type FilterList =
    | 'dateFrom'
    | 'dateTo'
    | 'tagsIncluded'
    | 'tagsExcluded'
    | 'domainsIncluded'
    | 'domainsExcluded'
    | 'listsIncluded'
    | 'listsExcluded'

export type SearchFilterType = 'date' | 'tag' | 'domain' | 'list'

export type SearchFilterLabel = 'Date' | 'Tags' | 'Domains' | 'Collections'

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
    domainsIncluded: string[]
    domainsExcluded: string[]

    limit: number
    skip: number
}

export type SearchFilterEvents = UIEvent<{
    setSearchQuery: { query: string }
    setSearchBarFocus: { isFocused: boolean }

    setSearchFiltersOpen: { isOpen: boolean }
    toggleShowTagPicker: { isActive: boolean }
    toggleShowDatePicker: { isActive: boolean }
    toggleShowDomainPicker: { isActive: boolean }

    setDateFromInputValue: { value: string }
    setDateToInputValue: { value: string }
    setDateFrom: { value: number }
    setDateTo: { value: number }

    addIncludedTag: { tag: string }
    delIncludedTag: { tag: string }
    addExcludedTag: { tag: string }
    delExcludedTag: { tag: string }

    addIncludedDomain: { domain: string }
    delIncludedDomain: { domain: string }
    addExcludedDomain: { domain: string }
    delExcludedDomain: { domain: string }

    setTagsIncluded: { tags: string[] }
    setTagsExcluded: { tags: string[] }
    setDomainsIncluded: { domains: string[] }
    setDomainsExcluded: { domains: string[] }

    resetFilters: null
}>
