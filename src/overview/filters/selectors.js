import { createSelector } from 'reselect'

export const filters = state => state.filters

export const popup = state => filters(state).popup
export const tags = state => filters(state).tags
export const domains = state => filters(state).domains

export const showFilters = createSelector(filters, state => state.showFilters)
export const onlyBookmarks = createSelector(
    filters,
    state => state.onlyBookmarks,
)

export const tagsStringify = createSelector(tags, tags => tags.join(','))

export const domainsStringify = createSelector(domains, domains =>
    domains.join(','),
)

export const showDomainsFilter = createSelector(
    popup,
    popup => popup === 'domain',
)

export const showTagsFilter = createSelector(popup, popup => popup === 'tag')

/**
 * Selector to toggle clear filter button
 * As new filters are added, corersponding changes need to made to this function
 */
export const showClearFiltersBtn = createSelector(
    onlyBookmarks,
    tags,
    domains,
    (onlyBookmarks, tags, domains) =>
        onlyBookmarks || !!tags.length || !!domains.length,
)
