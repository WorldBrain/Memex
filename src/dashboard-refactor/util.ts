import { RootState } from './types'
import { BackgroundSearchParams } from 'src/search/background/types'

export const updatePickerValues = (event: {
    added?: string
    deleted?: string
}) => (prevState: string[]): string[] => {
    if (event.added) {
        return [...new Set([...prevState, event.added])]
    }
    if (event.deleted) {
        return prevState.filter((tag) => tag !== event.deleted)
    }

    return prevState
}

export const areSearchFiltersEmpty = ({
    listsSidebar,
    searchFilters,
}: Pick<RootState, 'listsSidebar' | 'searchFilters'>): boolean =>
    !listsSidebar.selectedListId &&
    !searchFilters.dateFrom &&
    !searchFilters.dateTo &&
    !searchFilters.domainsExcluded.length &&
    !searchFilters.domainsIncluded.length &&
    !searchFilters.tagsExcluded.length &&
    !searchFilters.tagsIncluded.length &&
    !searchFilters.searchQuery.length

export const stateToSearchParams = ({
    searchFilters,
    listsSidebar,
}: Pick<
    RootState,
    'listsSidebar' | 'searchFilters'
>): BackgroundSearchParams => ({
    endDate: searchFilters.dateTo,
    startDate: searchFilters.dateFrom,
    query: searchFilters.searchQuery,
    domains: searchFilters.domainsIncluded,
    domainsExclude: searchFilters.domainsExcluded,
    tagsInc: searchFilters.tagsIncluded,
    tagsExc: searchFilters.tagsExcluded,
    limit: searchFilters.limit,
    skip: searchFilters.skip,
    lists:
        listsSidebar.selectedListId != null
            ? [listsSidebar.selectedListId]
            : undefined,
})
