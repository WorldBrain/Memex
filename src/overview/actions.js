import { createAction } from 'redux-act'

import { onDatabaseChange } from 'src/pouchdb'
import { filterVisitsByQuery } from 'src/search'
import { deleteVisitAndPage } from 'src/page-storage/deletion'
import * as selectors from './selectors'
import { RESULTS_PAGE_SIZE } from './constants'

// == Simple commands to change the state in reducers ==

export const setQuery = createAction('overview/setQuery', input => ({ query: input }))
export const setSearchResult = createAction('overview/setSearchResult')
export const appendSearchResult = createAction('overview/appendSearchResult')
export const showMoreLoading = createAction('overview/showMoreLoading')
export const hideMoreLoading = createAction('overview/hideMoreLoading')
export const showLoadingIndicator = createAction('overview/showLoadingIndicator')
export const hideLoadingIndicator = createAction('overview/hideLoadingIndicator')
export const setStartDate = createAction('overview/setStartDate', date => ({ startDate: date }))
export const setEndDate = createAction('overview/setEndDate', date => ({ endDate: date }))
export const hideVisit = createAction('overview/hideVisit')
export const nextPage = createAction('overview/nextPage')
export const resetPage = createAction('overview/resetPage')


// == Actions that trigger other actions ==

// Initialisation
export function init() {
    return function (dispatch, getState) {
        // Perform an initial search to populate the view (empty query = get all docs)
        dispatch(refreshSearch({loadingIndicator: true}))

        // Track database changes, to e.g. trigger search result refresh
        onDatabaseChange(change => dispatch(handlePouchChange({change})))
    }
}

export function deleteVisit({visitId}) {
    return async function (dispatch, getState) {
        // Hide the visit directly (optimistically).
        dispatch(hideVisit({visitId}))
        // Remove it from the database.
        await deleteVisitAndPage({visitId})
    }
}

// Search for docs matching the current query, update the results
export function refreshSearch({loadingIndicator = false, shouldResetPage = false} = {}) {
    return async function (dispatch, getState) {
        if (shouldResetPage) {
            dispatch(resetPage())
        }

        const state = getState()
        const { query, startDate, endDate, searchResult: oldResult } = selectors.ourState(state)
        const skip = selectors.resultsSkip(state)

        if (loadingIndicator) {
            // Show to the user that search is busy
            dispatch(showLoadingIndicator())
        }

        let searchResult
        try {
            searchResult = await filterVisitsByQuery({
                query,
                startDate,
                endDate,
                skip,
                limit: RESULTS_PAGE_SIZE,
                includeContext: false,
            })
        } catch (err) {
            // TODO give feedback to user that results are not actually updated.
            console.error(`Search for '${query}' erred: ${err}`)
            return
        } finally {
            if (loadingIndicator) {
                // Hide our nice loading animation again.
                dispatch(hideLoadingIndicator())
            }
        }

        // First check if the query and result changed in the meantime.
        const { query: updatedQuery, searchResult: updatedResult } = selectors.ourState(getState())
        if (updatedQuery !== query && updatedResult !== oldResult) {
            // The query already changed while we were searching, and the
            // currently displayed result may already be more recent than
            // ours. So we did all that effort for nothing.
            return
        }

        // If there is a skip, meaning we're on a page later than first page, we want to
        // just append the new results for this page to the existing results state
        const resultInsertAct = skip ? appendSearchResult : setSearchResult

        // Set the result to have it displayed to the user.
        dispatch(resultInsertAct({searchResult}))
    }
}

/**
 * Handles running actions related to pagination event to grab more results data.
 * Should update page state before running refreshSearch thunk.
 */
export const getMoreResults = () => async dispatch => {
    dispatch(showMoreLoading())
    dispatch(nextPage())
    await dispatch(refreshSearch())
    dispatch(hideMoreLoading())
}

// Report a change in the database, to e.g. trigger a search refresh
export const handlePouchChange = createAction('overview/handlePouchChange')
