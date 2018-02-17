import { createAction } from 'redux-act'

import { generatePageDocId } from 'src/page-storage'
import analytics, { updateLastActive } from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
import { actions as filterActs, selectors as filters } from './filters'
import * as constants from './constants'
import * as selectors from './selectors'
import { fetchTooltip } from './components/tooltips'

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
export const resetDeleteConfirm = createAction('overview/resetDeleteConfirm')
export const resetSharePopup = createAction('overview/resetSharePopup')
export const changeHasBookmark = createAction('overview/changeHasBookmark')
export const incSearchCount = createAction('overview/incSearchCount')
export const initSearchCount = createAction('overview/initSearchCount')
export const setResultDeleting = createAction('overview/setResultDeleting')
export const resetActiveShareIndex = createAction(
    'overview/resetActiveShareIndex',
)
export const setActiveShareIndex = createAction('overview/setActiveShareIndex')
export const copy = createAction('overview/truecopy')
export const resetActiveTagIndex = createAction('overview/resetActiveTagIndex')
export const setActiveTagIndex = createAction('overview/setActiveTagIndex')
export const addTag = createAction('overview/localAddTag', (tag, index) => ({
    tag,
    index,
}))
export const delTag = createAction('overview/localDelTag', (tag, index) => ({
    tag,
    index,
}))

export const setTooltip = createAction('overview/setTooltip')
export const toggleShowTooltip = createAction('overview/toggleShowTooltip')
export const setShowTooltip = createAction('overview/setShowTooltip')

const deleteDocsByUrl = remoteFunction('deleteDocsByUrl')
const createBookmarkByUrl = remoteFunction('createBookmarkByUrl')
const removeBookmarkByUrl = remoteFunction('removeBookmarkByUrl')

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

// Egg
const easter = () => dispatch =>
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
                        _attachments: { src: constants.EGG_IMG },
                        displayTime: Date.now().toString(),
                        hasBookmark: false,
                        egg: true,
                        tags: [],
                    },
                ],
            },
        }),
    )

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
    const firstState = getState()
    const currentQueryParams = selectors.currentQueryParams(firstState)
    const showTooltip = selectors.showTooltip(firstState)

    if (currentQueryParams.query.includes('#')) {
        return
    }

    dispatch(setLoading(true))

    if (showTooltip) {
        dispatch(fetchNextTooltip())
    }

    // Overwrite of results should always reset the current page before searching
    if (overwrite) {
        dispatch(resetPage())
    }

    if (/thank you/i.test(currentQueryParams.query)) {
        return dispatch(easter())
    }

    // Grab needed derived state for search
    const state = getState()
    const searchParams = {
        ...currentQueryParams,
        getTotalCount: true,
        showOnlyBookmarks: filters.onlyBookmarks(state),
        tags: filters.tags(state),
        domains: filters.domains(state),
        limit: constants.PAGE_SIZE,
        skip: selectors.resultsSkip(state),
    }

    // Tell background script to search
    port.postMessage({ cmd: constants.CMDS.SEARCH, searchParams, overwrite })
    updateLastActive() // Consider user active (analytics)
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
    if (filters.onlyBookmarks(state)) {
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
export const getMoreResults = () => dispatch => {
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

        const pageId = await generatePageDocId({ url })

        // Hide the result item + confirm modal directly (optimistically)
        dispatch(hideResultItem(pageId))
    } catch (error) {
    } finally {
        dispatch(setResultDeleting(undefined))
        updateLastActive() // Consider user active (analytics)
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
    } finally {
        updateLastActive() // Consider user active (analytics)
    }
}

export const showTags = index => (dispatch, getState) => {
    const activeTagIndex = selectors.activeTagIndex(getState())

    if (activeTagIndex === index) {
        dispatch(resetActiveTagIndex())
    } else {
        dispatch(setActiveTagIndex(index))
    }
}

export const openShare = index => (dispatch, getState) => {
    const activeShareIndex = selectors.activeShareIndex(getState())
    if (activeShareIndex === index) {
        dispatch(resetActiveShareIndex())
    } else {
        dispatch(setActiveShareIndex(index))
    }
}

export const changeCopy = index => (dispatch, getState) => {
    const copied = selectors.copy(getState())
    if (copied === false || copied === undefined) {
        dispatch(copy(true))
    } else {
        dispatch(copy(false))
    }
}

export const resetCopy = index => (dispatch, getState) => {
    dispatch(copy(false))
}

export const filterTag = tag => (dispatch, getState) => {
    const state = getState()
    const query = selectors.query(state)

    const transformedTag = `#${tag.split(' ').join('+')} `

    const newQuery = query.includes(transformedTag.slice(0, -1))
        ? query.replace(transformedTag, '') // Either remove it, if already there
        : transformedTag + query // or prepend it, if not there

    dispatch(setQueryTagsDomains(newQuery))
}

const stripTagPattern = tag =>
    tag
        .slice(1)
        .split('+')
        .join(' ')

export const setQueryTagsDomains = (input, isEnter) => (dispatch, getState) => {
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
            }

            // If 'domain.tld.cctld?' pattern in input, remove it and add to filter state
            if (constants.DOMAIN_TLD_PATTERN.test(term)) {
                removeFromInputVal(term)
                dispatch(filterActs.toggleDomainFilter(term))
            }
        })
    }

    dispatch(setQuery(input))
}

export const fetchNextTooltip = () => async dispatch => {
    const tooltip = await fetchTooltip()
    dispatch(setTooltip(tooltip))
}
