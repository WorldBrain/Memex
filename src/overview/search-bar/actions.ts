import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import analytics, { updateLastActive } from '../../analytics'
import { Thunk } from '../../options/types'
import * as constants from './constants'
import * as selectors from './selectors'
import { actions as sidebarActs } from '../sidebar-left'
import { acts as resultsActs, selectors as results } from '../results'
import {
    actions as filterActs,
    selectors as filters,
} from '../../search-filters'
import { actions as notifActs } from '../../notifications'

const processEventRPC = remoteFunction('processEvent')
const requestSearchRPC = remoteFunction('search')

export const setQuery = createAction<string>('header/setQuery')
export const setStartDate = createAction<number>('header/setStartDate')
export const setEndDate = createAction<number>('header/setEndDate')

const stripTagPattern = tag =>
    tag
        .slice(1)
        .split('+')
        .join(' ')

export const setQueryTagsDomains: (
    input: string,
    isEnter?: boolean,
) => Thunk = (input, isEnter = true) => dispatch => {
    const removeFromInputVal = term =>
        (input = input.replace(isEnter ? term : `${term} `, ''))

    if (input[input.length - 1] === ' ' || isEnter) {
        // Split input into terms and try to extract any tag/domain patterns to add to filters
        const terms = input.toLowerCase().match(/\S+/g) || []

        terms.forEach(term => {
            // If '#tag' pattern in input, remove it and add to filter state
            if (constants.HASH_TAG_PATTERN.test(term)) {
                removeFromInputVal(term)
                dispatch(filterActs.toggleTagFilter(stripTagPattern(term)))
                analytics.trackEvent({
                    category: 'Tag',
                    action: 'Filter by Tag',
                })
            }

            // If 'domain.tld.cctld?' pattern in input, remove it and add to filter state
            if (constants.DOMAIN_TLD_PATTERN.test(term)) {
                removeFromInputVal(term)

                // Choose to exclude or include domain, basead on pattern
                const act = constants.EXCLUDE_PATTERN.test(term)
                    ? filterActs.toggleExcDomainFilter
                    : filterActs.toggleIncDomainFilter

                term = term.replace(constants.TERM_CLEAN_PATTERN, '')
                dispatch(act(term))

                analytics.trackEvent({
                    category: 'Domain',
                    action: 'Filter by Domain',
                })
            }
        })
    }

    if (input.length > 0) {
        processEventRPC({ type: 'nlpSearch' })
    }

    dispatch(setQuery(input))
}

/**
 * Perform a search using the current query params as defined in state. Pagination
 * state will also be used to perform relevant pagination logic.
 *
 * @param [overwrite=false] Denotes whether to overwrite existing results or just append.
 */
export const search: (args?: any) => Thunk = (
    { overwrite } = { overwrite: false },
) => async (dispatch, getState) => {
    const firstState = getState()
    const query = selectors.query(firstState)
    const startDate = selectors.startDate(firstState)
    const endDate = selectors.endDate(firstState)

    // const showTooltip = selectors.showTooltip(firstState)
    if (filters.showClearFiltersBtn(getState())) {
        dispatch(sidebarActs.openSidebarFilterMode())
    }

    if (query.includes('#')) {
        return
    }

    dispatch(resultsActs.setLoading(true))

    // if (showTooltip) {
    //     dispatch(fetchNextTooltip())
    // }

    // Overwrite of results should always reset the current page before searching
    if (overwrite) {
        dispatch(resultsActs.resetPage())
    }

    if (/thank you/i.test(query)) {
        return dispatch(resultsActs.easter())
    }

    // Grab needed derived state for search

    const state = getState()
    const searchParams = {
        query,
        startDate,
        endDate,
        showOnlyBookmarks: filters.onlyBookmarks(state),
        tags: filters.tags(state),
        domains: filters.domainsInc(state),
        domainsExclude: filters.domainsExc(state),
        limit: constants.PAGE_SIZE,
        skip: results.resultsSkip(state),
        // lists for now is just id of one list
        lists: [filters.listFilter(state)],
    }

    try {
        // Tell background script to search
        const searchResult = await requestSearchRPC(searchParams)
        dispatch(resultsActs.updateSearchResult({ overwrite, searchResult }))

        if (searchResult.docs.length) {
            dispatch(resultsActs.incSearchCount())
        }
    } catch (error) {
        console.error(`Search for '${query}' errored: ${error.toString()}`)
        dispatch(resultsActs.setLoading(false))
    }

    updateLastActive() // Consider user active (analytics)
}

/**
 * Init a connection to the index running in the background script, allowing
 * redux actions to be dispatched whenever a command is received from the background script.
 * Also perform an initial search to populate the view (empty query = get all docs)
 */
export const init = () => (dispatch, getState) => {
    dispatch(notifActs.updateUnreadNotif())

    // Only do init search if empty query; if query set, the epic will trigger a search
    if (selectors.isEmptyQuery(getState())) {
        dispatch(search({ overwrite: true }))
    }
}
