import { createSelector } from 'reselect'
import get from 'lodash/fp/get'

import * as constants from './constants'

/**
 * Given an augmented page doc (returned from search module), determine its
 * "type" for use to display in the views. The `assoc` key will be checked to
 * see which of `visit` or `bookmark` is latest (if available), to set the type.
 * @param {any} pageDoc The augmented page doc from search results.
 * @returns {string} Display type string matching one of `constants.RESULT_TYPES`.
 */
function checkPageDocType({ assoc }) {
    if (!assoc) {
        return constants.RESULT_TYPES.UNKNOWN
    }
    const { visit, bookmark } = assoc

    // If both exist, find the time of the latest one
    if (visit && bookmark) {
        return visit.visitStart > bookmark.dateAdded
            ? constants.RESULT_TYPES.VISIT
            : constants.RESULT_TYPES.BOOKMARK
    } else if (visit) {
        return constants.RESULT_TYPES.VISIT
    } else if (bookmark) {
        return constants.RESULT_TYPES.BOOKMARK
    }

    return constants.RESULT_TYPES.UNKNOWN
}

/**
 * Given an augmented page doc, attempts to calculate its approx. freeze dry page size in MB.
 * @param {any} pageDoc The augmented page doc from search results.
 * @returns {string} Approx. size in MB of freeze-dry attachment. 0 if not found.
 */
function calcFreezeDrySize(pageDoc) {
    const pageSize = get(['_attachments', 'frozen-page.html', 'length'])(pageDoc)
    const sizeInMB = pageSize !== undefined
        ? Math.round(pageSize / 1024**2 * 10) / 10
        : 0

    return sizeInMB.toString()
}

/**
 * Either set display title to be the top-level title field, else look in content. Fallback is the URL.
 * @param {any} pageDoc The augmented page doc from search results.
 * @returns {string} Title string to display from page title, or URL in case of bad data..
 */
function decideTitle(pageDoc) {
    if (pageDoc.title) return pageDoc.title

    return (pageDoc.content && pageDoc.content.title) ? pageDoc.content.title : pageDoc.url
}

export const overview = state => state.overview
const searchResult = createSelector(overview, state => state.searchResult)
const resultDocs = createSelector(searchResult, results => results.docs)
export const currentQueryParams = createSelector(overview, state => state.currentQueryParams)
export const isLoading = createSelector(overview, state => state.isLoading)
export const noResults = createSelector(resultDocs, isLoading, (docs, isLoading) => docs.length === 0 && !isLoading)
export const currentPage = createSelector(overview, state => state.currentPage)
export const resultsSkip = createSelector(currentPage, page => page * constants.PAGE_SIZE)
export const deleteConfirmProps = createSelector(overview, state => state.deleteConfirmProps)
export const isDeleteConfShown = createSelector(deleteConfirmProps, state => state.isShown)
export const urlToDelete = createSelector(deleteConfirmProps, state => state.url)

export const results = createSelector(
    resultDocs,
    docs => docs.map(pageDoc => ({
        ...pageDoc,
        displayType: checkPageDocType(pageDoc),
        freezeDrySize: calcFreezeDrySize(pageDoc),
        title: decideTitle(pageDoc),
    })),
)

const resultsExhausted = createSelector(searchResult, results => results.resultsExhausted)
export const needsPagWaypoint = createSelector(
    resultsExhausted, isLoading,
    (isExhausted, isLoading) => !isLoading && !isExhausted,
)
