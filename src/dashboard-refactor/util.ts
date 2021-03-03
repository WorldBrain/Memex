import moment from 'moment'

import { SearchFilterType } from './header/types'
import { RootState, DatePickerVariant, NewFilterDetail } from './types'

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

export const getFilterDetail = (
    pickerType: SearchFilterType,
    filters: string | number | string[],
    variant?: DatePickerVariant,
    isExclusion?: boolean,
): NewFilterDetail => {
    if (typeof filters === 'number') {
        if (pickerType === 'date') {
            filters = moment(filters).format('h:mma, D MMM YYYY')
        }
    }
    const filterDetail: NewFilterDetail = {
        type: pickerType,
        filters:
            typeof filters === 'number'
                ? [`${filters}`]
                : typeof filters === 'string'
                ? [filters]
                : filters,
    }
    if (variant) {
        filterDetail['variant'] = variant
    }
    if (isExclusion) {
        filterDetail['isExclusion'] = isExclusion
    }
    return filterDetail
}

export const areSearchFiltersEmpty = ({
    listsSidebar,
    searchFilters,
}: RootState): boolean =>
    !listsSidebar.selectedListId &&
    !searchFilters.dateFrom &&
    !searchFilters.dateTo &&
    !searchFilters.domainsExcluded.length &&
    !searchFilters.domainsIncluded.length &&
    !searchFilters.tagsExcluded.length &&
    !searchFilters.tagsIncluded.length &&
    !searchFilters.searchQuery.length
