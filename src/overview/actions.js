import { createAction } from 'redux-act'

import { onDatabaseChange } from '../pouchdb'
import { filterVisitsByQuery } from '../search'
import { ourState } from './selectors'


// == Simple commands to change the state in reducers ==

export const setQuery = createAction('overview/setQuery')
export const setSearchResult = createAction('overview/setSearchResult')
export const showLoadIndicator = createAction('overview/showLoadIndicator')
export const hideLoadIndicator = createAction('overview/hideLoadIndicator')


// == Actions that trigger other actions ==

// Initialisation
export function init() {
    return function (dispatch, getState) {
        // Perform an initial search to populate the view (empty query = get all docs)
        dispatch(refreshSearch({showLoadingIndicator:true}))

        // Track database changes, to e.g. trigger search result refresh
        onDatabaseChange(change => dispatch(handlePouchChange({change})))
    }
}

// Search for docs matching the current query, update the results
export function refreshSearch({showLoadingIndicator=false}) {
    return function (dispatch, getState) {
        const query = ourState(getState()).query
        const oldResult = ourState(getState()).searchResult
        // To show a search was called for and to load the LoadingIndicator
        if (showLoadingIndicator) {
            dispatch(showLoadIndicator())
        }
        filterVisitsByQuery({query}).then(searchResult => {
            // To show the search ended and to stop the LoadingIndicator
            if (showLoadingIndicator) {
                dispatch(hideLoadIndicator())
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
        })
    }
}

// Report a change in the database, to e.g. trigger a search refresh
export const handlePouchChange = createAction('overview/handlePouchChange')
