import { createAction } from 'redux-act'

import analytics from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
import * as constants from './constants'
import * as selectors from './selectors'

// Will contain the runtime port which will allow bi-directional communication to the background script
let port

export const setLoading = createAction('overview/setLoading')
export const nextPage = createAction('overview/nextPage')
export const resetPage = createAction('overview/resetPage')
export const setSearchResult = createAction('overview/setSearchResult')
export const appendSearchResult = createAction('overview/appendSearchResult')
export const setQuery = createAction('overview/setQuery')
export const setStartDate = createAction('overview/setStartDate')
export const setEndDate = createAction('overview/setEndDate')
export const hideResultItem = createAction('overview/hideResultItem')
export const showDeleteConfirm = createAction(
    'overview/showDeleteConfirm',
    (url, index) => ({ url, index }),
)
export const hideDeleteConfirm = createAction('overview/hideDeleteConfirm')
export const showFilter = createAction('overview/showFilter')
export const toggleBookmarkFilter = createAction(
    'overview/toggleBookmarkFilter',
)
export const changeHasBookmark = createAction('overview/changeHasBookmark')
export const incSearchCount = createAction('overview/incSearchCount')
export const initSearchCount = createAction('overview/initSearchCount')
export const setResultDeleting = createAction('overview/setResultDeleting')

export const pageIdForTag = createAction('overview/pageIdForTag')
export const newTag = createAction('overview/newTag')
export const resultTags = createAction('overview/resultTags')
export const deleteTags = createAction('overview/deleteTags')
export const suggestedTags = createAction('overview/suggestedTags')

const deleteDocsByUrl = remoteFunction('deleteDocsByUrl')
const createBookmarkByUrl = remoteFunction('createBookmarkByUrl')
const removeBookmarkByUrl = remoteFunction('removeBookmarkByUrl')
const fetchTags = remoteFunction('fetchTags')
const suggestTags = remoteFunction('suggestTags')
const addTags = remoteFunction('addTags')
const delTags = remoteFunction('delTags')

const getCmdMessageHandler = dispatch => ({ cmd, ...payload }) => {
    switch (cmd) {
        case constants.CMDS.RESULTS:
            dispatch(updateSearchResult(payload))
            if (payload.searchResult.docs.length) {
                dispatch(incSearchCount())
            }
            break
        case constants.CMDS.ERROR:
            dispatch(handleErrors(payload))
            break
        default:
            console.error(
                `Background script sent unknown command '${cmd}' with payload:\n${payload}`,
            )
    }
}

/**
 * Init a connection to the index running in the background script, allowing
 * redux actions to be dispatched whenever a command is received from the background script.
 * Also perform an initial search to populate the view (empty query = get all docs)
 */
export const init = () => (dispatch, getState) => {
    port = browser.runtime.connect({ name: constants.SEARCH_CONN_NAME })
    port.onMessage.addListener(getCmdMessageHandler(dispatch))

    // Only do init search if empty query; if query set, the epic will trigger a search
    if (selectors.isEmptyQuery(getState())) {
        dispatch(search({ overwrite: true }))
    }
}

/**
 * Perform a search using the current query params as defined in state. Pagination
 * state will also be used to perform relevant pagination logic.
 *
 * @param {boolean} [overwrite=false] Denotes whether to overwrite existing results or just append.
 */
export const search = ({ overwrite } = { overwrite: false }) => async (
    dispatch,
    getState,
) => {
    dispatch(setLoading(true))

    // Overwrite of results should always reset the current page before searching
    if (overwrite) {
        dispatch(resetPage())
    }

    // Grab needed derived state for search
    const state = getState()
    const currentQueryParams = selectors.currentQueryParams(state)
    const skip = selectors.resultsSkip(state)
    const showOnlyBookmarks = selectors.showOnlyBookmarks(state)

    const searchParams = {
        ...currentQueryParams,
        getTotalCount: true,
        showOnlyBookmarks,
        limit: constants.PAGE_SIZE,
        skip,
    }

    // Tell background script to search
    port.postMessage({ cmd: constants.CMDS.SEARCH, searchParams, overwrite })
}

// Analytics use
function trackSearch(searchResult, overwrite, state) {
    // Value should be set as # results (if non-default search)
    const value =
        overwrite && !selectors.isEmptyQuery(state)
            ? searchResult.totalCount
            : undefined

    let action
    if (searchResult.totalCount > 0) {
        action = overwrite ? 'Successful search' : 'Paginate search'
    } else {
        action = 'Unsuccessful search'
    }
    if (selectors.showOnlyBookmarks(state)) {
        action += ' (BM only)'
    }

    const name = overwrite
        ? selectors.queryParamsDisplay(state)
        : selectors.currentPageDisplay(state)

    analytics.trackEvent({ category: 'Search', action, name, value })
}

const updateSearchResult = ({ searchResult, overwrite = false }) => (
    dispatch,
    getState,
) => {
    trackSearch(searchResult, overwrite, getState())

    const searchAction = overwrite ? setSearchResult : appendSearchResult

    dispatch(searchAction(searchResult))
    dispatch(setLoading(false))
}

// TODO stateful error handling
const handleErrors = ({ query, error }) => dispatch => {
    console.error(`Search for '${query}' errored: ${error}`)
    dispatch(setLoading(false))
}

/**
 * Increments the page state before scheduling another search.
 */
export const getMoreResults = () => async dispatch => {
    dispatch(nextPage())
    dispatch(search())
}

export const deleteDocs = () => async (dispatch, getState) => {
    const url = selectors.urlToDelete(getState())

    analytics.trackEvent({
        category: 'Overview',
        action: 'Delete result',
    })

    try {
        dispatch(hideDeleteConfirm())

        // Remove all assoc. docs from the database + index
        await deleteDocsByUrl(url)

        // Hide the result item + confirm modal directly (optimistically)
        dispatch(hideResultItem(url))
    } catch (error) {
    } finally {
        dispatch(setResultDeleting(undefined))
    }
}

export const toggleBookmark = (url, index) => async (dispatch, getState) => {
    const results = selectors.results(getState())
    const { hasBookmark } = results[index]
    dispatch(changeHasBookmark(index)) // Reset UI state in case of error

    analytics.trackEvent({
        category: 'Overview',
        action: hasBookmark
            ? 'Remove result bookmark'
            : 'Create result bookmark',
    })

    try {
        // Either perform adding or removal of bookmark if
        if (hasBookmark) {
            await removeBookmarkByUrl(url)
        } else {
            await createBookmarkByUrl(url)
        }
    } catch (error) {
        dispatch(changeHasBookmark(index)) // Reset UI state in case of error
    }
}

function findIndexValue(a, tag) {
    return a.findIndex(i => i.value === tag)
}

export const FetchInitResultTags = () => async (dispatch, getState) => {
    const state = getState()
    const pageId = selectors.pageIdForTag(state)
    const tagsFromBackend = await fetchTags(pageId)

    tagsFromBackend.sort()

    const tags = []
    for (let i = 0; i < tagsFromBackend.length; i++) {
        tags.push({ isSelected: true, value: tagsFromBackend[i] })
    }

    dispatch(resultTags(tags))
}

export const addTagsFromOverview = tag => async (dispatch, getState) => {
    const state = getState()
    const pageId = selectors.pageIdForTag(state)
    const tags = [...selectors.resultTags(state)]
    const index = findIndexValue(tags, tag)

    if (index === -1) {
        tags.unshift({ isSelected: true, value: tag })
    } else if (tags[index].isSelected === false) {
        tags[index].isSelected = true
    }

    await addTags(pageId, [tag])
    dispatch(resultTags(tags))
    dispatch(newTag(''))
    dispatch(suggestedTags([]))
}

export const delTagsFromOverview = tag => async (dispatch, getState) => {
    const state = getState()
    const pageId = selectors.pageIdForTag(state)
    const tags = [...selectors.resultTags(state)]
    const index = findIndexValue(tags, tag)

    if (index !== -1) {
        tags[index].isSelected = false
        await delTags(pageId, [tag])

        dispatch(resultTags(tags))
    }
}

export const produceNewTag = tag => async (dispatch, getState) => {
    const state = getState()
    const tags = selectors.resultTags(state)
    const index = findIndexValue(tags, tag)

    if (index !== -1) {
        tag = ''
    }

    dispatch(newTag(tag))
}

export const addTagsFromOverviewOnEnter = tag => async (dispatch, getState) => {
    const state = getState()
    const pageId = selectors.pageIdForTag(state)
    const tags = [...selectors.resultTags(state)]
    const suggestTags = [...selectors.suggestedTags(state)]

    if (suggestTags.length === 0) {
        tags.unshift({ isSelected: true, value: tag })
        await addTags(pageId, [tag])

        dispatch(resultTags(tags))
        dispatch(newTag(''))
        dispatch(suggestedTags([]))
    }
}

export const suggestTagFromOverview = term => async (dispatch, getState) => {
    const tags = await suggestTags(term)
    dispatch(suggestedTags(tags))
}
