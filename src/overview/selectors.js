import { createSelector } from 'reselect'

import * as constants from './constants'

/**
 * Either set display title to be the top-level title field, else look in content. Fallback is the URL.
 * @param {any} pageDoc The augmented page doc from search results.
 * @returns {string} Title string to display from page title, or URL in case of bad data..
 */
function decideTitle(pageDoc) {
    if (pageDoc.title) return pageDoc.title

    return pageDoc.content && pageDoc.content.title
        ? pageDoc.content.title
        : pageDoc.url
}

export const overview = state => state.overview
const searchResult = createSelector(overview, state => state.searchResult)
const resultDocs = createSelector(searchResult, results => results.docs)
export const currentQueryParams = createSelector(
    overview,
    state => state.currentQueryParams,
)

export const isLoading = createSelector(overview, state => state.isLoading)
export const noResults = createSelector(
    resultDocs,
    isLoading,
    (docs, isLoading) => docs.length === 0 && !isLoading,
)
export const currentPage = createSelector(overview, state => state.currentPage)
export const resultsSkip = createSelector(
    currentPage,
    page => page * constants.PAGE_SIZE,
)
export const deleteConfirmProps = createSelector(
    overview,
    state => state.deleteConfirmProps,
)
export const isDeleteConfShown = createSelector(
    deleteConfirmProps,
    state => state.isShown,
)
export const urlToDelete = createSelector(
    deleteConfirmProps,
    state => state.url,
)

export const results = createSelector(resultDocs, docs =>
    docs.map(pageDoc => ({
        ...pageDoc,
        title: decideTitle(pageDoc),
    })),
)

export const isBadTerm = createSelector(
    searchResult,
    results => !!results.isBadTerm,
)

const resultsExhausted = createSelector(
    searchResult,
    results => results.resultsExhausted,
)
export const needsPagWaypoint = createSelector(
    resultsExhausted,
    isLoading,
    (isExhausted, isLoading) => !isLoading && !isExhausted,
)

export const isNewSearchLoading = createSelector(
    isLoading,
    currentPage,
    (isLoading, currentPage) => isLoading && currentPage === 0,
)
export const showFilter = state => overview(state).showFilter
export const showOnlyBookmarks = state => overview(state).showOnlyBookmarks

export const isEmptyQuery = createSelector(
    currentQueryParams,
    showOnlyBookmarks,
    ({ query, startDate, endDate }, showOnlyBookmarks) =>
        !query.length && !startDate && !endDate && !showOnlyBookmarks,
)

export const bookmarkInfoToSend = createSelector(
    overview,
    state => state.toggleBookmarkUrl,
)
