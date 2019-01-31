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

export const tags = createSelector(searchFilters, state => state.tags)
export const suggestedTags = createSelector(
    searchFilters,
    state => state.suggestedTags,
)
export const suggestedDomains = createSelector(
    searchFilters,
    state => state.suggestedDomains,
)
export const domainsInc = createSelector(
    searchFilters,
    state => state.domainsInc,
)
export const domainsExc = createSelector(
    searchFilters,
    state => state.domainsExc,
)
export const listFilter = createSelector(searchFilters, state => state.lists)
export const displayDomains = createSelector(
    domainsInc,
    domainsExc,
    (inc, exc) => [
        ...inc.map(value => ({ value, isExclusive: false })),
        ...exc.map(value => ({ value, isExclusive: true })),
    ],
)

export const showFilters = createSelector(
    searchFilters,
    state => state.showFilters,
)
export const onlyBookmarks = createSelector(
    searchFilters,
    state => state.onlyBookmarks,
)

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

export const listFilterActive = createSelector(
    listFilter,
    lists => lists !== '',
)

export const contentType = createSelector(
    searchFilters,
    state => state.contentTypes,
)

export const websitesFilter = createSelector(contentType, state => state.pages)
export const highlightsFilter = createSelector(
    contentType,
    state => state.highlights,
)
export const notesFilter = createSelector(contentType, state => state.notes)

/**
 * Selector for the annotation content type filter.
 * Is true if both highlights and notes filter is selected.
 */
export const annotationsFilter = createSelector(
    notesFilter,
    highlightsFilter,
    (notes, highlights) => notes && highlights,
)
