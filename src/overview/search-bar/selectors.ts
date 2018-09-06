/* tslint:disable:no-shadowed-variable */
import { createSelector } from 'reselect'

import { RootState } from '../../options/types'
import { selectors as filterSelectors } from '../../search-filters'

const searchBar = (state: RootState) => state.searchBar

export const query = createSelector(searchBar, state => state.query)
export const endDate = createSelector(searchBar, state => state.endDate)
export const startDate = createSelector(searchBar, state => state.startDate)

export const isEmptyQuery = createSelector(
    query,
    startDate,
    endDate,
    filterSelectors.onlyBookmarks,
    filterSelectors.tags,
    filterSelectors.displayDomains,
    (
        q,
        startDateVal,
        endDateVal,
        showOnlyBookmarks,
        filterTags,
        filterDomains,
    ) =>
        !q.length &&
        !startDateVal &&
        !endDateVal &&
        !showOnlyBookmarks &&
        !filterTags.length &&
        !filterDomains.length,
)

export const queryParamsDisplay = createSelector(
    query,
    startDate,
    endDate,
    (query, startDate, endDate) => {
        let val = ''

        if (query && query.length) {
            val += 'T'
        }

        if (startDate) {
            val += ' SD'
        }

        if (endDate) {
            val += ' ED'
        }

        return val
    },
)
