import { createSelector } from 'reselect'

import * as filterSelectors from './filters/selectors'
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

export const searchCount = createSelector(overview, state => state.searchCount)

export const currentQueryParams = createSelector(
    overview,
    state => state.currentQueryParams,
)

export const query = createSelector(currentQueryParams, params => params.query)
export const startDate = createSelector(
    currentQueryParams,
    params => params.startDate,
)
export const endDate = createSelector(
    currentQueryParams,
    params => params.endDate,
)

export const queryParamsDisplay = createSelector(
    currentQueryParams,
    ({ startDate, endDate, query }) => {
        let val = ''

        if (query && query.length) {
            val += 'T'
        }

        if (startDate) {
            val += ' SD'
        }

        if (endDate) {
            val += ' ED'
        }

        return val
    },
)

export const isLoading = createSelector(overview, state => state.isLoading)
export const noResults = createSelector(
    resultDocs,
    isLoading,
    (docs, isLoading) => docs.length === 0 && !isLoading,
)
export const currentPage = createSelector(overview, state => state.currentPage)

export const currentPageDisplay = createSelector(
    currentPage,
    page => `Page: ${page}`,
)

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
export const deletingResultIndex = createSelector(
    deleteConfirmProps,
    state => state.deleting,
)

export const activeTagIndex = createSelector(
    overview,
    state => state.activeTagIndex,
)

export const activeShareIndex = createSelector(
    overview,
    state => state.activeShareIndex,
)
export const copy = createSelector(overview, state => state.copy)
export const results = createSelector(
    resultDocs,
    isDeleteConfShown,
    deletingResultIndex,
    activeTagIndex,
    activeShareIndex,
    copy,
    (docs, modalShown, deleting, tagIndex, shareIndex, copy) =>
        docs.map((pageDoc, i) => ({
            ...pageDoc,
            title: decideTitle(pageDoc),
            isDeleting: !modalShown && i === deleting,
            tagPillsData: pageDoc.tags.slice(0, constants.SHOWN_TAGS_LIMIT),
            shouldDisplayTagPopup: i === tagIndex,
            shouldDisplaySharePopup: i === shareIndex,
            copy: copy,
        })),
)

export const showInitSearchMsg = createSelector(
    searchCount,
    resultDocs,
    isLoading,
    (searchCount, results, isLoading) =>
        !results.length && !searchCount && !isLoading,
)

export const isBadTerm = createSelector(
    searchResult,
    results => !!results.isBadTerm,
)

const resultsExhausted = createSelector(
    searchResult,
    results => results.resultsExhausted,
)

export const totalResultCount = createSelector(
    searchResult,
    results => results.totalCount,
)

export const shouldShowCount = createSelector(
    currentQueryParams,
    ({ query, startDate, endDate }) =>
        query.length > 0 || startDate != null || endDate != null,
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

export const isEmptyQuery = createSelector(
    currentQueryParams,
    filterSelectors.onlyBookmarks,
    filterSelectors.tags,
    filterSelectors.domains,
    (
        { query, startDate, endDate },
        showOnlyBookmarks,
        filterTags,
        filterDomains,
    ) =>
        !query.length &&
        !startDate &&
        !endDate &&
        !showOnlyBookmarks &&
        !filterTags.length &&
        !filterDomains.length,
)
