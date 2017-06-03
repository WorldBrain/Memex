import { createSelector } from 'reselect'

import { RESULTS_PAGE_SIZE } from './constants'

export const ourState = state => state.overview
const currentPage = state => ourState(state).currentPage
const waitingForMoreResults = state => ourState(state).waitingForMoreResults
const searchResult = state => ourState(state).searchResult

export const resultsLimit = createSelector(currentPage, page => page * RESULTS_PAGE_SIZE)
export const isMoreLoading = createSelector(waitingForMoreResults, loading => loading > 0)
export const areMoreResults = createSelector(searchResult, ({ rows: resultRows } = {}) => {
    // Base case when no results
    if (!resultRows || !resultRows.length) return false

    // General case
    return resultRows.length % RESULTS_PAGE_SIZE === 0
})
