import { createAction } from 'redux-act'

export const setFilterPopup = createAction('search-filters/setFilterPopup')
export const resetFilterPopup = createAction('search-filters/resetFilterPopup')
export const addTagFilter = createAction('search-filters/addTagFilter')
export const delTagFilter = createAction('search-filters/delTagFilter')
export const toggleTagFilter = createAction('search-filters/toggleTagFilter')
export const addIncDomainFilter = createAction(
    'search-filters/addIncDomainFilter',
)
export const addExcDomainFilter = createAction(
    'search-filters/addExcDomainFilter',
)
export const delIncDomainFilter = createAction(
    'search-filters/delIncDomainFilter',
)
export const delExcDomainFilter = createAction(
    'search-filters/delExcDomainFilter',
)
export const toggleIncDomainFilter = createAction(
    'search-filters/toggleIncDomainFilter',
)
export const toggleExcDomainFilter = createAction(
    'search-filters/toggleExcDomainFilter',
)
export const setTagFilters = createAction('search-filters/setTagFilters')
export const setListFilters = createAction('searc-filters/setListFilters')
export const setIncDomainFilters = createAction(
    'search-filters/setIncDomainFilters',
)
export const setExcDomainFilters = createAction(
    'search-filters/setExcDomainFilters',
)

export const resetFilters = createAction('search-filters/resetFilters')
export const showFilter = createAction('search-filters/showFilter')
export const toggleBookmarkFilter = createAction(
    'search-filters/toggleBookmarkFilter',
)

export const addListFilter = createAction('search-filters/addListFilter')
export const delListFilter = createAction('search-filters/delListFilter')
export const toggleListFilter = createAction('search-filters/toggleListFilter')
