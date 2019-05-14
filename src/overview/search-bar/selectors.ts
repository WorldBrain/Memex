/* tslint:disable:no-shadowed-variable */
import { createSelector } from 'reselect'

import { RootState } from '../../options/types'
import * as filterSelectors from '../../search-filters/selectors'

const searchBar = (state: RootState) => state.searchBar

export const query = createSelector(searchBar, state => state.query)
export const endDate = createSelector(searchBar, state => state.endDate)
export const startDate = createSelector(searchBar, state => state.startDate)
export const endDateText = createSelector(searchBar, state => state.endDateText)
export const startDateText = createSelector(
    searchBar,
    state => state.startDateText,
)

export const isEmptyQuery = createSelector(
    query,
    startDate,
    endDate,
    filterSelectors.onlyBookmarks,
    filterSelectors.displayTags,
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

export const showClearFiltersBtn = createSelector(
    filterSelectors.onlyBookmarks,
    filterSelectors.tags,
    filterSelectors.tagsExc,
    filterSelectors.domainsInc,
    filterSelectors.domainsExc,
    filterSelectors.usersInc,
    filterSelectors.usersExc,
    startDate,
    endDate,
    (
        onlyBookmarks,
        tags,
        tagsExc,
        domainsInc,
        domainsExc,
        usersInc,
        usersExc,
        startDate,
        endDate,
    ) =>
        onlyBookmarks ||
        !!tags.length ||
        !!tagsExc.length ||
        !!domainsInc.length ||
        !!domainsExc.length ||
        !!usersInc.length ||
        !!usersExc.length ||
        startDate ||
        endDate,
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
