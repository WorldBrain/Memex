/* tslint:disable:no-shadowed-variable */
import { createSelector } from 'reselect'

import { RootState } from '../../options/types'
import { selectors as deleteConfSelectors } from '../delete-confirm-modal'
import { PAGE_SIZE } from '../search-bar/constants'
import * as sidebarLeft from '../sidebar-left/selectors'
import * as constants from './constants'

/**
 * Either set display title to be the top-level title field, else look in content. Fallback is the URL.
 * @param {any} pageDoc The augmented page doc from search results.
 * @returns {string} Title string to display from page title, or URL in case of bad data..
 */
function decideTitle(pageDoc) {
    if (pageDoc.title) {
        return pageDoc.title
    }

    return pageDoc.content && pageDoc.content.title
        ? pageDoc.content.title
        : pageDoc.url
}

const resultsState = (state: RootState) => state.results

export const isLoading = createSelector(resultsState, state => state.isLoading)
export const resultDocs = createSelector(resultsState, state => state.results)
export const activeTagIndex = createSelector(
    resultsState,
    state => state.activeTagIndex,
)
export const currentPage = createSelector(
    resultsState,
    state => state.currentPage,
)
const resultsExhausted = createSelector(
    resultsState,
    results => results.resultsExhausted,
)

export const isBadTerm = createSelector(
    resultsState,
    results => !!results.isBadTerm,
)

export const isInvalidSearch = createSelector(
    resultsState,
    results => !!results.isInvalidSearch,
)

export const totalResultCount = createSelector(
    resultsState,
    state => state.totalCount,
)
export const searchCount = createSelector(
    resultsState,
    state => state.searchCount,
)

export const currentPageDisplay = createSelector(
    currentPage,
    page => `Page: ${page}`,
)

export const isNewSearchLoading = createSelector(
    isLoading,
    currentPage,
    (isLoading, currentPage) => isLoading && currentPage === 0,
)

export const resultsSkip = createSelector(currentPage, page => page * PAGE_SIZE)

export const noResults = createSelector(
    resultDocs,
    isLoading,
    (results, isLoading) => results.length === 0 && !isLoading,
)

export const needsPagWaypoint = createSelector(
    resultsExhausted,
    isLoading,
    (isExhausted, isLoading) => !isLoading && !isExhausted,
)

export const shouldShowCount = createSelector(
    totalResultCount,
    isLoading,
    (count, isLoading) => count != null && !isLoading,
)

export const results = createSelector(
    resultDocs,
    deleteConfSelectors.isShown,
    deleteConfSelectors.indexToDelete,
    activeTagIndex,
    (docs, modalShown, deleting, tagIndex) =>
        docs.map((pageDoc, i) => ({
            ...pageDoc,
            title: decideTitle(pageDoc),
            isDeleting: !modalShown && i === deleting,
            tagPillsData: pageDoc.tags.slice(0, constants.SHOWN_TAGS_LIMIT),
            shouldDisplayTagPopup: i === tagIndex,
        })),
)

export const showInitSearchMsg = createSelector(
    searchCount,
    resultDocs,
    isLoading,
    (searchCount, results, isLoading) =>
        !results.length && !searchCount && !isLoading,
)

export const isScrollDisabled = createSelector(
    sidebarLeft.mouseOverSidebar,
    mouseOverSidebar => mouseOverSidebar,
)
