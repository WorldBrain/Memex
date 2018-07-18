import { createSelector } from 'reselect'

export const searchFilters = state => state.searchFilters

export const tagFilter = createSelector(
    searchFilters,
    state => state.showTagFilter,
)

export const domainFilter = createSelector(
    searchFilters,
    state => state.showDomainFilter,
)

export const filterTypes = createSelector(
    searchFilters,
    state => state.showFilterTypes,
)
