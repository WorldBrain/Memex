import { createSelector } from 'reselect'

import safelyGet from 'src/util/safe-nested-access'
import orderedGroupBy from 'src/util/ordered-group-by'

import * as constants from './constants'

export const ourState = state => state.overview
const searchResult = state => ourState(state).searchResult

/**
 * `latestResult` will contain the latest visit (to display in ResultsList);
 * `rest` contains the later visits as an array in original order of appearance (relevance + time)
 */
const resultsStateShape = ([latestResult, ...rest]) => ({ latestResult, rest })

/**
 * Given the search results, group them by URL and shape them so that the UI can easily pick out the
 * latest visit for display in the main view, and the later visits to display on-demand.
 */
export const results = createSelector(searchResult, ({ rows: results } = {}) =>
    orderedGroupBy(safelyGet('doc.url'))(results)
        .map(resultsStateShape)) // Final map over the groupBy output to make nicer UI state

export const currentQueryParams = createSelector(ourState, state => state.currentQueryParams)
export const isLoading = createSelector(ourState, state => state.isLoading)
export const currentPage = createSelector(ourState, state => state.currentPage)
export const resultsSkip = createSelector(currentPage, page => page * constants.PAGE_SIZE)
export const resultsExhausted = createSelector(searchResult, searchResult => searchResult.resultsExhausted)
export const deleteConfirmProps = createSelector(ourState, state => state.deleteConfirmProps)
export const isDeleteConfShown = createSelector(deleteConfirmProps, state => state.isShown)
export const deleteVisitId = createSelector(deleteConfirmProps, state => state.visitId)
