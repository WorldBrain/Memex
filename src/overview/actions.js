import { createAction } from 'redux-act'

import { remoteFunction } from 'src/util/webextensionRPC'
import * as constants from './constants'
import * as selectors from './selectors'

// Will contain the runtime port which will allow bi-directional communication to the background script
let port

// == Simple commands to change the state in reducers ==

export const setLoading = createAction('overview/setLoading')
export const nextPage = createAction('overview/nextPage')
export const resetPage = createAction('overview/resetPage')
export const setSearchResult = createAction('overview/setSearchResult')
export const appendSearchResult = createAction('overview/appendSearchResult')
export const setQuery = createAction('overview/setQuery')
export const setStartDate = createAction('overview/setStartDate')
export const setEndDate = createAction('overview/setEndDate')
export const hideResultItem = createAction('overview/hideResultItem')
export const showDeleteConfirm = createAction('overview/showDeleteConfirm')
export const hideDeleteConfirm = createAction('overview/hideDeleteConfirm')
export const showFilter = createAction('overview/showFilter')
export const toggleBookmarkFilter = createAction(
    'overview/toggleBookmarkFilter',
)
export const changeHasBookmark = createAction('overview/changeHasBookmark')

const deleteDocsByUrl = remoteFunction('deleteDocsByUrl')
const createBookmarkByExtension = remoteFunction('createBookmarkByExtension')
const removeBookmarkByUrl = remoteFunction('removeBookmarkByUrl')

async function incSearchCount() {
    const {
        [constants.SEARCH_COUNT_KEY]: searchCount,
    } = await browser.storage.local.get({
        [constants.SEARCH_COUNT_KEY]: 0,
    })

    return browser.storage.local.set({
        [constants.SEARCH_COUNT_KEY]: searchCount + 1,
    })
}

const getCmdMessageHandler = dispatch => ({ cmd, ...payload }) => {
    switch (cmd) {
        case constants.CMDS.RESULTS:
            dispatch(updateSearchResult(payload))
            incSearchCount()
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
        showOnlyBookmarks,
        limit: constants.PAGE_SIZE,
        skip,
    }

    // Tell background script to search
    port.postMessage({ cmd: constants.CMDS.SEARCH, searchParams, overwrite })
}

const updateSearchResult = (
    { searchResult, overwrite } = { overwrite: false, searchResult: [] },
) => dispatch => {
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

    // Hide the result item + confirm modal directly (optimistically)
    dispatch(hideResultItem(url))
    dispatch(hideDeleteConfirm())

    // Remove all assoc. docs from the database + index
    await deleteDocsByUrl(url)

    // Refresh search view after deleting all assoc docs
    dispatch(search({ overwrite: true }))
}

export const toggleBookmark = (url, index) => async (dispatch, getState) => {
    const results = selectors.results(getState())

    if (results[index].hasBookmark) {
        await removeBookmarkByUrl(url)
    } else {
        await createBookmarkByExtension(url)
    }
}
