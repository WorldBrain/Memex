import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import analytics from '../../analytics'
import { Thunk } from '../../options/types'
import * as selectors from './selectors'
import * as constants from './constants'
import { SearchResult } from '../types'
import { selectors as searchBar, acts as searchBarActs } from '../search-bar'
import { selectors as filters } from '../../search-filters'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { bookmarks, notifications } from 'src/util/remote-functions-background'

const processEventRPC = remoteFunction('processEvent')
const createSocialBookmarkRPC = remoteFunction('addSocialBookmark')
const deleteSocialBookmarkRPC = remoteFunction('delSocialBookmark')

export const addTag = createAction('results/localAddTag', (tag, index) => ({
    tag,
    index,
}))

export const delTag = createAction('results/localDelTag', (tag, index) => ({
    tag,
    index,
}))

export const addList = createAction('results/localAddList', (list, index) => ({
    list,
    index,
}))

export const delList = createAction('results/localDelList', (list, index) => ({
    list,
    index,
}))

export const setShowOnboardingMessage = createAction<boolean>(
    'results/setShowOnboardingMessage',
)

export const hideResultItem = createAction<string>('results/hideResultItem')
export const changeHasBookmark = createAction<number>(
    'results/changeHasBookmark',
)
export const resetSearchResult = createAction('results/resetSearchResult')
export const setSearchResult = createAction<SearchResult>(
    'results/setSearchResult',
)
export const appendSearchResult = createAction<SearchResult>(
    'results/appendSearchResult',
)
export const setLoading = createAction<boolean>('results/setLoading')
export const setAreAnnotationsExpanded = createAction<boolean>(
    'results/setAreAnnotationsExpanded',
)
export const toggleAreAnnotationsExpanded = createAction(
    'results/toggleAreAnnotationsExpanded',
)
export const resetActiveListIndex = createAction('results/resetActiveListIndex')
export const setActiveListIndex = createAction<number>(
    'results/setActiveListIndex',
)
export const resetActiveTagIndex = createAction('results/resetActiveTagIndex')
export const setActiveTagIndex = createAction<number>(
    'results/setActiveTagIndex',
)
export const resetActiveSidebarIndex = createAction(
    'results/resetActiveSidebarIndex',
)
export const setActiveSidebarIndex = createAction<number>(
    'results/setActiveSidebarIndex',
)
export const nextPage = createAction('results/nextPage')
export const resetPage = createAction('results/resetPage')
export const setSearchType = createAction<'page' | 'notes' | 'social'>(
    'results/setSearchType',
)
export const initSearchCount = createAction('overview/initSearchCount')
export const incSearchCount = createAction('overview/incSearchCount')

export const toggleBookmark: (args: {
    url: string
    fullUrl: string
    index: number
}) => Thunk = ({ url, fullUrl, index }) => async (dispatch, getState) => {
    const results = selectors.results(getState())
    const { hasBookmark, user } = results[index]
    dispatch(changeHasBookmark(index))

    analytics.trackEvent({
        category: 'Bookmarks',
        action: hasBookmark ? 'deleteForPage' : 'createForPage',
    })

    processEventRPC({
        type: hasBookmark
            ? EVENT_NAMES.REMOVE_RESULT_BOOKMARK
            : EVENT_NAMES.CREATE_RESULT_BOOKMARK,
    })

    let bookmarkRPC: (args: { url: string; fullUrl: string }) => Promise<void>
    // tslint:disable-next-line: prefer-conditional-expression
    if (hasBookmark) {
        bookmarkRPC = user ? deleteSocialBookmarkRPC : bookmarks.delPageBookmark
    } else {
        bookmarkRPC = user ? createSocialBookmarkRPC : bookmarks.addPageBookmark
    }

    try {
        await bookmarkRPC({ url, fullUrl })
    } catch (err) {
        dispatch(changeHasBookmark(index))
        handleDBQuotaErrors(
            (error) =>
                notifications.create({
                    requireInteraction: false,
                    title: 'Memex error: starring page',
                    message: error.message,
                }),
            () => remoteFunction('dispatchNotification')('db_error'),
        )(err)
    }
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
export const easter: () => Thunk = () => (dispatch) =>
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

export const toggleShowTagsPicker: (i: number) => Thunk = (index) => (
    dispatch,
    getState,
) => {
    const activeTagIndex = selectors.activeTagIndex(getState())

    if (activeTagIndex === index) {
        dispatch(resetActiveTagIndex())
    } else {
        dispatch(resetActiveListIndex())
        dispatch(setActiveTagIndex(index))
    }
}

export const toggleShowListsPicker: (i: number) => Thunk = (index) => (
    dispatch,
    getState,
) => {
    const activeListIndex = selectors.activeListIndex(getState())

    if (activeListIndex === index) {
        dispatch(resetActiveListIndex())
    } else {
        dispatch(resetActiveTagIndex())
        dispatch(setActiveListIndex(index))
    }
}

/**
 * Increments the page state before scheduling another search.
 */
export const getMoreResults: (fromOverview?: boolean) => Thunk = (
    fromOverview = true,
) => (dispatch) => {
    dispatch(nextPage())
    dispatch(searchBarActs.search({ fromOverview }))
}

// Analytics use
function trackSearch(searchResult, overwrite, state) {
    if (searchBar.isEmptyQuery(state)) {
        return
    }

    // Value should be set as # results (if non-default search)
    const value = overwrite ? searchResult.totalCount : undefined

    const action =
        searchResult.docs.length > 0
            ? overwrite
                ? 'successViaOverview'
                : 'paginateSearch'
            : 'failViaOverview'

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
