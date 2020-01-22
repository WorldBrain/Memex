import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import analytics from '../../analytics'
import { Thunk } from '../../options/types'
import * as constants from './constants'
import * as selectors from './selectors'
import { actions as sidebarActs } from 'src/sidebar-overlay/sidebar'
import { acts as resultsActs, selectors as results } from '../results'
import {
    actions as filterActs,
    selectors as filters,
} from '../../search-filters'
import { actions as notifActs } from '../../notifications'
import { EVENT_NAMES } from '../../analytics/internal/constants'

const processEventRPC = remoteFunction('processEvent')
const pageSearchRPC = remoteFunction('searchPages')
const annotSearchRPC = remoteFunction('searchAnnotations')
const socialSearchRPC = remoteFunction('searchSocial')

export const doQuery = createAction<string>('header/doQuery')
export const setQuery = createAction<string>('header/setQuery')
export const setStartDate = createAction<number>('header/setStartDate')
export const setEndDate = createAction<number>('header/setEndDate')
export const setStartDateText = createAction<string>('header/setStartDateText')
export const setEndDateText = createAction<string>('header/setEndDateText')
export const clearFilters = createAction('header/clearFilters')

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
                dispatch(filterActs.setShowFilterBar(true))
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
                dispatch(filterActs.setShowFilterBar(true))

                analytics.trackEvent({
                    category: 'Domain',
                    action: 'Filter by Domain',
                })
            }
        })
    }

    if (input.length > 0) {
        processEventRPC({ type: EVENT_NAMES.NLP_SEARCH })
    }

    dispatch(resultsActs.setLoading(true))
    dispatch(setQuery(input))
}

/**
 * Perform a search using the current query params as defined in state. Pagination
 * state will also be used to perform relevant pagination logic.
 *
 * @param [overwrite=false] Denotes whether to overwrite existing results or just append.
 * @param [fromOverview=true] Denotes whether search is done from overview or inpage.
 */
export const search: (args?: any) => Thunk = (
    { fromOverview, overwrite } = { fromOverview: true, overwrite: false },
) => async (dispatch, getState) => {
    const firstState = getState()
    const query = selectors.query(firstState)
    const startDate = selectors.startDate(firstState)
    const endDate = selectors.endDate(firstState)

    // const showTooltip = selectors.showTooltip(firstState)

    if (query.includes('#')) {
        return
    }

    if (fromOverview) {
        dispatch(sidebarActs.closeSidebar())
    }

    dispatch(resultsActs.resetActiveSidebarIndex())
    dispatch(resultsActs.setLoading(true))

    // if (showTooltip) {
    //     dispatch(fetchNextTooltip())
    // }

    // Overwrite of results should always reset the current page before searching
    if (overwrite) {
        dispatch(resultsActs.resetPage())
        dispatch(resultsActs.resetSearchResult())
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
        tagsInc: filters.tags(state),
        tagsExc: filters.tagsExc(state),
        domains: filters.domainsInc(state),
        domainsExclude: filters.domainsExc(state),
        limit: constants.PAGE_SIZE,
        skip: results.resultsSkip(state),
        lists: filters.listFilterParam(state),
        contentTypes: filters.contentType(state),
        base64Img: !fromOverview,
        usersInc: filters.usersInc(state),
        usersExc: filters.usersExc(state),
        hashtagsInc: filters.hashtagsInc(state),
        hashtagsExc: filters.hashtagsExc(state),
    }

    try {
        const searchRPC = results.isSocialPost(state)
            ? socialSearchRPC
            : results.isAnnotsSearch(state)
            ? annotSearchRPC
            : pageSearchRPC

        // Tell background script to search
        const searchResult = await searchRPC(searchParams)
        dispatch(resultsActs.updateSearchResult({ overwrite, searchResult }))

        if (searchResult.docs.length) {
            dispatch(resultsActs.incSearchCount())
        }
    } catch (error) {
        console.error(`Search for '${query}' errored: ${error.toString()}`)
        dispatch(resultsActs.setLoading(false))
    }
}

export const init = () => dispatch => {
    dispatch(notifActs.updateUnreadNotif())
}
