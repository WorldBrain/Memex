import { createSelector } from 'reselect'

import { RESULTS_PAGE_SIZE } from './constants'

export const ourState = state => state.overview
const currentPage = state => ourState(state).currentPage

export const resultsLimit = createSelector(currentPage, page => page * RESULTS_PAGE_SIZE)
