import { createAction } from 'redux-act'

export const setFilterPopup = createAction('search-filters/setFilterPopup')
export const resetFilterPopup = createAction('search-filters/resetFilterPopup')
export const addTagFilter = createAction('search-filters/addTagFilter')
export const delTagFilter = createAction('search-filters/delTagFilter')
export const toggleTagFilter = createAction('search-filters/toggleTagFilter')
export const addDomainFilter = createAction('search-filters/addDomainFilter')
export const delDomainFilter = createAction('search-filters/delDomainFilter')
export const toggleDomainFilter = createAction(
    'search-filters/toggleDomainFilter',
)
export const setTagFilters = createAction('search-filters/setTagFilters')
export const setDomainFilters = createAction('search-filters/setDomainFilters')

export const resetFilters = createAction('search-filters/resetFilters')
export const showFilter = createAction('search-filters/showFilter')
export const toggleBookmarkFilter = createAction(
    'search-filters/toggleBookmarkFilter',
)
