import { createSelector } from 'reselect'

import { RESULTS_PAGE_SIZE } from './constants'

export const ourState = state => state.overview
const currentPage = state => ourState(state).currentPage
const waitingForMoreResults = state => ourState(state).waitingForMoreResults
const query = state => ourState(state).query

export const resultsLimit = createSelector(currentPage, page => page * RESULTS_PAGE_SIZE)
export const isMoreLoading = createSelector(waitingForMoreResults, loading => loading > 0)
export const isFiltered = createSelector(query, query => query.length > 0)
