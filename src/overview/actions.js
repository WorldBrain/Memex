import { createAction } from 'redux-act'

import { onDatabaseChange } from '../pouchdb'
import { filterVisitsByQuery } from '../search'
import { ourState } from './selectors'


// == Simple commands to change the state in reducers ==

export const setQuery = createAction('overview/setQuery')
export const setSearchResult = createAction('overview/setSearchResult')


// == Actions that trigger other actions ==

// Initialisation
export function init() {
    return function (dispatch, getState) {
        // Perform an initial search to populate the view (empty query = get all docs)
        dispatch(refreshSearch())

        // Track database changes, to e.g. trigger search result refresh
        onDatabaseChange(change => dispatch(handlePouchChange({change})))
    }
}

// Search for docs matching the current query, update the results
export function refreshSearch() {
    return function (dispatch, getState) {
        const query = ourState(getState()).query
        filterVisitsByQuery({query}).then(
            searchResult => dispatch(setSearchResult({searchResult}))
        )
    }
}

// Report a change in the database, to e.g. trigger a search refresh
export const handlePouchChange = createAction('overview/handlePouchChange')
