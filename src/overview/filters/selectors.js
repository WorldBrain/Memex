import { createSelector } from 'reselect'

export const filters = state => state.filters

export const popup = createSelector(filters, state => state.popup)
export const tags = createSelector(filters, state => state.tags)
export const domainsInc = createSelector(filters, state => state.domainsInc)
export const domainsExc = createSelector(filters, state => state.domainsExc)
export const displayDomains = createSelector(
    domainsInc,
    domainsExc,
    (inc, exc) => [
        ...inc.map(value => ({ value, isExclusive: false })),
        ...exc.map(value => ({ value, isExclusive: true })),
    ],
)

export const showFilters = createSelector(filters, state => state.showFilters)
export const onlyBookmarks = createSelector(
    filters,
    state => state.onlyBookmarks,
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
    domainsInc,
    domainsExc,
    (onlyBookmarks, tags, domainsInc, domainsExc) =>
        onlyBookmarks ||
        !!tags.length ||
        !!domainsInc.length ||
        !!domainsExc.length,
)
