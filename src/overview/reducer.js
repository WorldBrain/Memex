import update from 'lodash/fp/update'
import remove from 'lodash/fp/remove'
import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    searchCount: 0,
    currentPage: 0, // Pagination state
    searchResult: {
        docs: [], // The current search result list
        resultsExhausted: false,
        totalCount: 0,
    },
    // The current search input values
    currentQueryParams: {
        query: '',
        startDate: undefined,
        endDate: undefined,
    },
    isLoading: true,
    deleteConfirmProps: {
        isShown: false,
        url: undefined,
        // Used to keep track of any particular result (use index)
        deleting: undefined,
    },
    activeTagIndex: -1,
    tooltip: null,
    showTooltip: true,
}

function setQuery(state, query) {
    return {
        ...state,
        currentQueryParams: { ...state.currentQueryParams, query },
    }
}

function setStartDate(state, date) {
    return {
        ...state,
        currentQueryParams: { ...state.currentQueryParams, startDate: date },
    }
}

function setEndDate(state, date) {
    return {
        ...state,
        currentQueryParams: { ...state.currentQueryParams, endDate: date },
    }
}

function hideResultItem(state, url) {
    return update('searchResult.docs', docs =>
        remove(doc => doc.url === url)(docs),
    )(state)
}

const addTag = (state, { tag, index }) => {
    const doc = state.searchResult.docs[index]
    const docs = [
        ...state.searchResult.docs.slice(0, index),
        {
            ...doc,
            tags: [...doc.tags, tag],
        },
        ...state.searchResult.docs.slice(index + 1),
    ]

    return {
        ...state,
        searchResult: {
            ...state.searchResult,
            docs,
        },
    }
}

const delTag = (state, { tag, index }) => {
    const doc = state.searchResult.docs[index]
    const removalIndex = doc.tags.findIndex(val => val === tag)
    if (removalIndex === -1) {
        return state
    }

    const docs = [
        ...state.searchResult.docs.slice(0, index),
        {
            ...doc,
            tags: [
                ...doc.tags.slice(0, removalIndex),
                ...doc.tags.slice(removalIndex + 1),
            ],
        },
        ...state.searchResult.docs.slice(index + 1),
    ]

    return {
        ...state,
        searchResult: {
            ...state.searchResult,
            docs,
        },
    }
}

const showDeleteConfirm = (state, { url, index }) => ({
    ...state,
    deleteConfirmProps: {
        ...state.deleteConfirmProps,
        isShown: true,
        url,
        deleting: index,
    },
})

const hideDeleteConfirm = state => ({
    ...state,
    deleteConfirmProps: {
        ...defaultState.deleteConfirmProps,
        deleting: state.deleteConfirmProps.deleting,
    },
})

// Updates search result state by either overwriting or appending
const handleSearchResult = ({ overwrite }) => (state, newSearchResult) => {
    const searchResult = overwrite
        ? newSearchResult
        : {
              ...newSearchResult,
              docs: [...state.searchResult.docs, ...newSearchResult.docs],
          }

    return { ...state, searchResult }
}

const changeHasBookmark = (state, index) => {
    const currResult = state.searchResult.docs[index]

    const searchResult = {
        ...state.searchResult,
        docs: [
            ...state.searchResult.docs.slice(0, index),
            {
                ...currResult,
                hasBookmark: !currResult.hasBookmark,
            },
            ...state.searchResult.docs.slice(index + 1),
        ],
    }

    return { ...state, searchResult }
}

const incSearchCount = state => ({
    ...state,
    searchCount: state.searchCount + 1,
})
const initSearchCount = (state, searchCount) => ({ ...state, searchCount })

const payloadReducer = key => (state, payload) => ({ ...state, [key]: payload })

export default createReducer(
    {
        [actions.appendSearchResult]: handleSearchResult({ overwrite: false }),
        [actions.setSearchResult]: handleSearchResult({ overwrite: true }),
        [actions.setLoading]: (state, isLoading) => ({ ...state, isLoading }),
        [actions.setQuery]: setQuery,
        [actions.setStartDate]: setStartDate,
        [actions.setEndDate]: setEndDate,
        [actions.hideResultItem]: hideResultItem,
        [actions.incSearchCount]: incSearchCount,
        [actions.initSearchCount]: initSearchCount,
        [actions.changeHasBookmark]: changeHasBookmark,
        [actions.showDeleteConfirm]: showDeleteConfirm,
        [actions.hideDeleteConfirm]: hideDeleteConfirm,
        [actions.resetDeleteConfirm]: state => ({
            ...state,
            deleteConfirmProps: { ...defaultState.deleteConfirmProps },
        }),
        [actions.setResultDeleting]: (state, index) => ({
            ...state,
            deleteConfirmProps: {
                ...state.deleteConfirmProps,
                deleting: index,
            },
        }),
        [actions.nextPage]: state => ({
            ...state,
            currentPage: state.currentPage + 1,
        }),
        [actions.resetPage]: state => ({
            ...state,
            currentPage: defaultState.currentPage,
        }),
        [actions.resetActiveTagIndex]: state => ({
            ...state,
            activeTagIndex: defaultState.activeTagIndex,
        }),
        [actions.setActiveTagIndex]: payloadReducer('activeTagIndex'),
        [actions.addTag]: addTag,
        [actions.delTag]: delTag,
        [actions.setTooltip]: (state, tooltip) => ({
            ...state,
            tooltip: tooltip,
        }),
        [actions.toggleShowTooltip]: state => ({
            ...state,
            showTooltip: !state.showTooltip,
        }),
        [actions.setShowTooltip]: (state, showTooltip) => ({
            ...state,
            showTooltip: showTooltip,
        }),
    },
    defaultState,
)
