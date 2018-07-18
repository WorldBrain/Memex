import { createAction } from 'redux-act'

export const showTagFilter = createAction('search-filters/showTagFilter')
export const hideTagFilter = createAction('search-filters/hideTagFilter')
export const showDomainFilter = createAction('search-filters/showDomainFilter')
export const hideDomainFilter = createAction('search-filters/hideDomainter')
export const showFilterTypes = createAction('search-filters/showTypeFilters')
export const hideFilterTypes = createAction('search-filters/hideTypeFilters')
export const toggleFilterTypes = createAction(
    'search-filters/toggleFilterTypes',
)
