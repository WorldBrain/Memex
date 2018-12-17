import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import analytics, { updateLastActive } from '../../analytics'
import { Thunk } from '../../options/types'
import * as selectors from './selectors'
import * as constants from './constants'
import { SearchResult } from '../types'
import { selectors as searchBar, acts as searchBarActs } from '../search-bar'
import { selectors as filters } from '../../search-filters'
import { EVENT_NAMES } from '../../analytics/internal/constants'

const processEventRPC = remoteFunction('processEvent')
const createBookmarkRPC = remoteFunction('addBookmark')
const removeBookmarkRPC = remoteFunction('delBookmark')

export const addTag = createAction('results/localAddTag', (tag, index) => ({
    tag,
    index,
}))

export const delTag = createAction('results/localDelTag', (tag, index) => ({
    tag,
    index,
}))

export const hideResultItem = createAction<string>('results/hideResultItem')
export const changeHasBookmark = createAction<number>(
    'results/changeHasBookmark',
)
export const setSearchResult = createAction<SearchResult>(
    'results/setSearchResult',
)
export const appendSearchResult = createAction<SearchResult>(
    'results/appendSearchResult',
)
export const setLoading = createAction<boolean>('results/setLoading')
export const resetActiveTagIndex = createAction('results/resetActiveTagIndex')
export const setActiveTagIndex = createAction<number>(
    'results/setActiveTagIndex',
)
export const nextPage = createAction('results/nextPage')
export const resetPage = createAction('results/resetPage')
export const initSearchCount = createAction('overview/initSearchCount')
export const incSearchCount = createAction('overview/incSearchCount')

export const toggleBookmark: (url: string, i: number) => Thunk = (
    url,
    index,
) => async (dispatch, getState) => {
    const results = selectors.results(getState())
    const { hasBookmark } = results[index]
    dispatch(changeHasBookmark(index)) // Reset UI state in case of error

    analytics.trackEvent({
        category: 'Overview',
        action: hasBookmark
            ? 'Remove result bookmark'
            : 'Create result bookmark',
    })

    processEventRPC({
        type: hasBookmark
            ? EVENT_NAMES.REMOVE_RESULT_BOOKMARK
            : EVENT_NAMES.CREATE_RESULT_BOOKMARK,
    })

    // Reset UI state in case of error
    const errHandler = err => dispatch(changeHasBookmark(index))

    // Either perform adding or removal of bookmark; do not wait for ops to complete
    if (hasBookmark) {
        removeBookmarkRPC({ url }).catch(errHandler)
    } else {
        createBookmarkRPC({ url }).catch(errHandler)
    }

    updateLastActive() // Consider user active (analytics)
}

export const updateSearchResult: (a: any) => Thunk = ({
    searchResult,
    overwrite = false,
}) => (dispatch, getState) => {
    trackSearch(searchResult, overwrite, getState())
    storeSearch(searchResult, overwrite, getState())

    const searchAction = overwrite ? setSearchResult : appendSearchResult

    dispatch(searchAction(searchResult))
    dispatch(setLoading(false))
}

// Egg
export const easter: () => Thunk = () => dispatch =>
    dispatch(
        updateSearchResult({
            overwrite: true,
            searchResult: {
                resultsExhausted: true,
                totalCount: 1,
                docs: [
                    {
                        content: { title: constants.EGG_TITLE },
                        url: constants.EGG_URL,
                        screenshot: constants.EGG_IMG,
                        displayTime: Date.now().toString(),
                        hasBookmark: false,
                        tags: [],
                    },
                ],
            },
        }),
    )

export const showTags: (i: number) => Thunk = index => (dispatch, getState) => {
    const activeTagIndex = selectors.activeTagIndex(getState())

    if (activeTagIndex === index) {
        dispatch(resetActiveTagIndex())
    } else {
        dispatch(setActiveTagIndex(index))
    }
}

/**
 * Increments the page state before scheduling another search.
 */
export const getMoreResults: () => Thunk = () => dispatch => {
    dispatch(nextPage())
    dispatch(searchBarActs.search())
}

// Analytics use
function trackSearch(searchResult, overwrite, state) {
    // Value should be set as # results (if non-default search)
    const value =
        overwrite && !searchBar.isEmptyQuery(state)
            ? searchResult.totalCount
            : undefined

    let action =
        searchResult.totalCount > 0
            ? overwrite
                ? 'Successful search'
                : 'Paginate search'
            : 'Unsuccessful search'

    if (filters.onlyBookmarks(state)) {
        action += ' (BM only)'
    }

    const name = overwrite
        ? searchBar.queryParamsDisplay(state)
        : selectors.currentPageDisplay(state)

    analytics.trackEvent({ category: 'Search', action, name, value })
}

// Internal analytics store
function storeSearch(searchResult, overwrite, state) {
    const type =
        searchResult.totalCount === 0
            ? EVENT_NAMES.UNSUCCESSFUL_SEARCH
            : overwrite
            ? EVENT_NAMES.SUCCESSFUL_SEARCH
            : EVENT_NAMES.PAGINATE_SEARCH

    processEventRPC({ type })

    if (filters.onlyBookmarks(state)) {
        processEventRPC({ type: EVENT_NAMES.BOOKMARK_FILTER })
    }

    if (filters.tags(state).length > 0) {
        processEventRPC({ type: EVENT_NAMES.TAG_FILTER })
    }

    if (
        filters.domainsInc(state).length > 0 ||
        filters.domainsExc(state).length > 0
    ) {
        processEventRPC({ type: EVENT_NAMES.DOMAIN_FILTER })
    }
}
