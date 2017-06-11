import { createAction } from 'redux-act'

import { filterVisitsByQuery } from 'src/search'
import { deleteVisitAndPage } from 'src/page-storage/deletion'
import asyncActionCreator from 'src/util/redux-async-action-creator'

import { ourState } from './selectors'


// == Simple commands to change the state in reducers ==

export const setQuery = createAction('overview/setQuery')
export const appendSearchResult = createAction('overview/appendSearchResult')
export const showLoadingIndicator = createAction('overview/showLoadingIndicator')
export const hideLoadingIndicator = createAction('overview/hideLoadingIndicator')
export const setStartDate = createAction('overview/setStartDate')
export const setEndDate = createAction('overview/setEndDate')
export const hideVisit = createAction('overview/hideVisit')


// == Actions that trigger other actions ==

// Initialisation
export function init() {
    return function (dispatch, getState) {
        // Perform an initial search to populate the view (empty query = get all docs)
        dispatch(newSearch({loadingIndicator: true}))
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

const runSearch = () => async (dispatch, getState) => {
    const { query, startDate, endDate } = ourState(getState())
    const searchResult = await filterVisitsByQuery({
        query,
        startDate,
        endDate,
        includeContext: true,
    })
    return searchResult
}

export const newSearch = asyncActionCreator({
    actionCreator: runSearch,
})
