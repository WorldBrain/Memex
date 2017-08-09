import last from 'lodash/fp/last'
import isEqual from 'lodash/fp/isEqual'
import { createAction } from 'redux-act'

import { filterVisitsByQuery } from 'src/search/search-index'
import { deleteVisitAndPage } from 'src/page-storage/deletion'
import asyncActionCreator from 'src/util/redux-async-action-creator'

import { ourState } from './selectors'


// == Simple commands to change the state in reducers ==

export const setQuery = createAction('overview/setQuery')
export const setStartDate = createAction('overview/setStartDate')
export const setEndDate = createAction('overview/setEndDate')
export const hideVisit = createAction('overview/hideVisit')
export const showDeleteConfirm = createAction('overview/showDeleteConfirm')
export const hideDeleteConfirm = createAction('overview/hideDeleteConfirm')


// == Actions that trigger other actions ==

// Initialisation
export function init() {
    return function (dispatch, getState) {
        // Perform an initial search to populate the view (empty query = get all docs)
        dispatch(newSearch())
    }
}

export const deleteVisit = (visitId, deleteAssoc = false) => async (dispatch, getState) => {
    // Hide the visit + confirm modal directly (optimistically).
    dispatch(hideVisit(visitId))
    dispatch(hideDeleteConfirm())
    // Remove it from the database.
    await deleteVisitAndPage({visitId, deleteAssoc})

    // Refresh search view after deleting all assoc docs
    if (deleteAssoc) {
        dispatch(newSearch())
    }
}

export const newSearch = asyncActionCreator(() => async (dispatch, getState) => {
    const { currentQueryParams } = ourState(getState())
    const searchResult = await filterVisitsByQuery({
        ...currentQueryParams,
        limit: 10,
    })
    return searchResult
})

export const expandSearch = asyncActionCreator(() => async (dispatch, getState) => {
    const { currentQueryParams, searchResult } = ourState(getState())
    // Look from which item the search should continue.
    const skipUntil = searchResult.searchedUntil
        || (searchResult.rows.length && last(searchResult.rows).id)
        || undefined
    // Get the items that are to be appended.
    const newSearchResult = await filterVisitsByQuery({
        ...currentQueryParams,
        skipUntil,
        limit: 10,
    })
    return newSearchResult
})

export const updateSearch = () => (dispatch, getState) => {
    const state = ourState(getState())
    if (isEqual(state.activeQueryParams, state.currentQueryParams)) {
        // The query has not actually changed since our last search, so no need to update.
        return
    }
    // Cancel any running searches and start again.
    newSearch.cancelAll()
    expandSearch.cancelAll()
    dispatch(newSearch())
}

export const loadMoreResults = () => (dispatch, getState) => {
    // If a search is already running, don't do anything.
    if (newSearch.isPending() || expandSearch.isPending()) return
    dispatch(expandSearch())
}
