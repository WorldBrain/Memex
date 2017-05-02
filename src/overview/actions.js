import { createAction } from 'redux-act'

import { onDatabaseChange } from 'src/pouchdb'
import { filterVisitsByQuery } from 'src/search'
import { ourState } from './selectors'


// == Simple commands to change the state in reducers ==

export const setQuery = createAction('overview/setQuery')
export const setSearchResult = createAction('overview/setSearchResult')
export const appendSearchResult = createAction('overview/appendSearchResult')
export const showLoadingIndicator = createAction('overview/showLoadingIndicator')
export const hideLoadingIndicator = createAction('overview/hideLoadingIndicator')
export const setStartDate = createAction('overview/setStartDate')
export const setEndDate = createAction('overview/setEndDate')


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

// Search for docs matching the current query, update the results
export function refreshSearch({loadingIndicator = false}) {
    return async function (dispatch, getState) {
        const { query, startDate, endDate } = ourState(getState())
        const oldResult = ourState(getState()).searchResult

        if (loadingIndicator) {
            // Show to the user that search is busy
            dispatch(showLoadingIndicator())
        }

        const searchResult = await filterVisitsByQuery({
            query,
            startDate,
            endDate,
            includeContext: true,
        })
        if (loadingIndicator) {
            // Hide our nice loading animation again.
            dispatch(hideLoadingIndicator())
        }

        // First check if the query and result changed in the meantime.
        if (ourState(getState()).query !== query
            && ourState(getState()).searchResult !== oldResult) {
            // The query already changed while we were searching, and the
            // currently displayed result may already be more recent than
            // ours. So we did all that effort for nothing.
            return
        }

        // Set the result to have it displayed to the user.
        dispatch(setSearchResult({searchResult}))
    }
}

// Getting more results
export function getMoreResults({loadingIndicator = false, endDate, scrollPosition}) {
    return async function (dispatch, getState) {
        const { query, startDate } = ourState(getState())

        if (loadingIndicator) {
            // Show to the user that search is busy
            dispatch(showLoadingIndicator())
        }

        const searchResult = await filterVisitsByQuery({
            query,
            startDate,
            endDate,
            includeContext: true,
        })
        if (loadingIndicator) {
            // Hide our nice loading animation again.
            dispatch(hideLoadingIndicator())
        }

        // Append the result to have it displayed to the user.
        dispatch(appendSearchResult({searchResult}))

        if (scrollPosition) {
            // Scroll back the position where the more results funtion was fire
            // because after the new results are appended the whole view is re-rendered scrolling back to the begining
            // So we need to scroll back to the point where the user left.
            window.scrollTo(0, scrollPosition)
        }
    }
}

// Report a change in the database, to e.g. trigger a search refresh
export const handlePouchChange = createAction('overview/handlePouchChange')
