import { createAction } from 'redux-act'

import { onDatabaseChange } from 'src/pouchdb'
import { filterVisitsByQuery } from 'src/search'
import { deleteVisitAndPage } from 'src/page-storage/deletion'
import { ourState } from './selectors'
import extractTimeFiltersFromQuery from 'src/util/nlp-time-filter'

// == Simple commands to change the state in reducers ==

export const setQuery = createAction('overview/setQuery')
export const setSearchResult = createAction('overview/setSearchResult')
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
export function refreshSearch({loadingIndicator = false}) {
    return async function (dispatch, getState) {
        let {
            query,
            startDate: oldStartDate,
            endDate: oldEndDate,
            searchResult: oldResult,
        } = ourState(getState())

        const {
            startDate: newStartDate,
            endDate: newEndDate,
            extractedQuery,
        } = extractTimeFiltersFromQuery(query)

        const startDate = newStartDate || oldStartDate
        const endDate = newEndDate || oldEndDate
        query = extractedQuery || query

        if (oldStartDate !== newStartDate) dispatch(setStartDate({startDate}))
        if (oldEndDate !== newEndDate) dispatch(setEndDate({endDate}))

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
                includeContext: true,
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

// Report a change in the database, to e.g. trigger a search refresh
export const handlePouchChange = createAction('overview/handlePouchChange')
