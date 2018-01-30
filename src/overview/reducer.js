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
    showFilter: false,
    showOnlyBookmarks: false,
    activeTagIndex: -1,
    filterPopup: '',
    filterTags: [],
    filterDomains: [],
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

function toggleBookmarkFilter(state, showOnlyBookmarks) {
    return {
        ...state,
        showOnlyBookmarks:
            showOnlyBookmarks === true
                ? showOnlyBookmarks
                : !state.showOnlyBookmarks,
        showFilter: true,
    }
}

function resetFilters(state) {
    return {
        ...state,
        showOnlyBookmarks: defaultState.showOnlyBookmarks,
        filterTags: defaultState.filterTags,
        filterDomains: defaultState.filterDomains,
    }
}

function hideResultItem(state, pageId) {
    return update('searchResult.docs', docs =>
        remove(doc => doc._id === pageId)(docs),
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

const addFilter = filterKey => (state, value) => ({
    ...state,
    [filterKey]: [...state[filterKey], value],
    showFilter: true,
})

const delFilter = filterKey => (state, value) => {
    const removalIndex = state[filterKey].indexOf(value)

    if (removalIndex === -1) {
        return state
    }

    return {
        ...state,
        [filterKey]: [
            ...state[filterKey].slice(0, removalIndex),
            ...state[filterKey].slice(removalIndex + 1),
        ],
        showFilter: true,
    }
}

const toggleFilter = filterKey => (state, value) => {
    const removalIndex = state[filterKey].indexOf(value)

    if (removalIndex === -1) {
        return addFilter(filterKey)(state, value)
    }

    return {
        ...state,
        [filterKey]: [
            ...state[filterKey].slice(0, removalIndex),
            ...state[filterKey].slice(removalIndex + 1),
        ],
        showFilter: true,
    }
}

const setTagFilters = (state, tags) => {
    if (typeof tags === 'string') {
        tags = tags.split(',')
    }

    return {
        ...state,
        filterTags: tags,
        showFilter: true,
    }
}

const setDomainFilters = (state, domains) => {
    if (typeof domains === 'string') {
        domains = domains.split(',')
    }

    return {
        ...state,
        filterDomains: domains,
        showFilter: true,
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

const setFilterPopup = (state, name) => {
    let filterPopup = state.filterPopup

    /*
        filterPopup{'tag'|'domain'|''} and name{'tag|domain'} is when click on any tag/domain
        when length is zero,it means set on the same as click
        if name is same as filterPopup, it means click on the same so just unset it
        otherwise the different one. e.g. id tag is there then just set the domain and vice versa
    */
    if (!filterPopup.length) {
        filterPopup = name
    } else if (filterPopup === name) {
        filterPopup = ''
    } else {
        if (filterPopup === 'domain') {
            filterPopup = 'tag'
        } else {
            filterPopup = 'domain'
        }
    }

    return { ...state, filterPopup }
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
        [actions.toggleBookmarkFilter]: toggleBookmarkFilter,
        [actions.resetFilters]: resetFilters,
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
        [actions.showFilter]: state => ({
            ...state,
            showFilter: !state.showFilter,
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
        [actions.setFilterPopup]: setFilterPopup,
        [actions.resetFilterPopup]: state => ({
            ...state,
            filterPopup: defaultState.filterPopup,
        }),
        [actions.addTagFilter]: addFilter('filterTags'),
        [actions.delTagFilter]: delFilter('filterTags'),
        [actions.toggleTagFilter]: toggleFilter('filterTags'),
        [actions.addDomainFilter]: addFilter('filterDomains'),
        [actions.delDomainFilter]: delFilter('filterDomains'),
        [actions.toggleDomainFilter]: toggleFilter('filterDomains'),
        [actions.setTagFilters]: setTagFilters,
        [actions.setDomainFilters]: setDomainFilters,
    },
    defaultState,
)
