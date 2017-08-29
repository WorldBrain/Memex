import { createAction } from 'redux-act'

import indexSearch from 'src/search'
import { deleteVisitAndPage } from 'src/page-storage/deletion'

import * as constants from './constants'
import * as selectors from './selectors'

// == Simple commands to change the state in reducers ==

export const setLoading = createAction('overview/setLoading')
export const nextPage = createAction('overview/nextPage')
export const resetPage = createAction('overview/resetPage')
export const setSearchResult = createAction('overview/setSearchResult')
export const appendSearchResult = createAction('overview/appendSearchResult')
export const setQuery = createAction('overview/setQuery')
export const setStartDate = createAction('overview/setStartDate')
export const setEndDate = createAction('overview/setEndDate')
export const hideVisit = createAction('overview/hideVisit')
export const showDeleteConfirm = createAction('overview/showDeleteConfirm')
export const hideDeleteConfirm = createAction('overview/hideDeleteConfirm')

// Perform an initial search to populate the view (empty query = get all docs)
export const init = () => dispatch => dispatch(search({ overwrite: true }))

/**
 * Perform a search using the current query params as defined in state. Pagination
 * state will also be used to perform relevant pagination logic.
 * @param {boolean} [overwrite=false] Denotes whether to overwrite existing results or just append.
 */
export const search = ({ overwrite } = { overwrite: false }) => async (dispatch, getState) => {
    dispatch(setLoading(true))

    // If overwrite set, need to reset pagination state and set up action to overwrite current results
    let searchAction
    if (overwrite) {
        dispatch(resetPage())
        searchAction = setSearchResult
    } else {
        searchAction = appendSearchResult
    }

    // Grab needed derived state for search
    const state = getState()
    const currentQueryParams = selectors.currentQueryParams(state)
    const skip = selectors.resultsSkip(state)

    try {
        const searchResult = await indexSearch({
            ...currentQueryParams,
            limit: constants.PAGE_SIZE,
            skip,
        })

        dispatch(searchAction(searchResult))
    } catch (error) {
        // TODO give feedback to user that results are not actually updated.
        console.error(`Search for '${currentQueryParams.query}' errored: ${error}`)
    } finally {
        dispatch(setLoading(false))
    }
}

/**
 * Increments the page state before scheduling another search.
 */
export const getMoreResults = () => async dispatch => {
    dispatch(nextPage())
    dispatch(search())
}

export const deleteVisit = (visitId, deleteAssoc = false) => async (dispatch, getState) => {
    // Hide the visit + confirm modal directly (optimistically).
    dispatch(hideVisit(visitId))
    dispatch(hideDeleteConfirm())
    // Remove it from the database.
    await deleteVisitAndPage({ visitId, deleteAssoc })

    // Refresh search view after deleting all assoc docs
    if (deleteAssoc) {
        dispatch(search({ overwrite: true }))
    }
}
