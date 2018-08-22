import { createReducer } from 'redux-act'

import * as acts from './actions'
import { SearchResult, Result } from '../types'
import { isInvalidSearch } from './selectors'

export interface State {
    /** Holds the current search results used to render to the UI. */
    results: Result[]
    /** Denotes whether or not the results have been exhausted for current search. */
    resultsExhausted: boolean
    /** Denotes whether or not the current search is being waited on. */
    isLoading: boolean
    /** Denotes whether or not the current search only had bad terms. */
    isBadTerm: boolean
    /** Denotes whether or not the current search only had invalid filters. */
    isInvalidSearch: boolean
    /** Holds the index of the result where the tags popup should be displayed (-1 by default). */
    activeTagIndex: number
    /** Holds the current page of results that the user has scrolled to (0-based). */
    currentPage: number
    /** Holds the total count of matching results to the current search (includes not-shown results). */
    totalCount: number
    /** Holds the number of searches performed. */
    searchCount: number
}

const defState: State = {
    results: [],
    resultsExhausted: false,
    isLoading: true,
    isBadTerm: false,
    isInvalidSearch: false,
    activeTagIndex: -1,
    currentPage: 0,
    totalCount: null,
    searchCount: 0,
}

const handleSearchResult = (overwrite: boolean) => (
    state: State,
    payload: SearchResult,
): State => {
    const results = overwrite
        ? payload.docs
        : [...state.results, ...payload.docs]

    return {
        ...state,
        resultsExhausted: payload.resultsExhausted,
        totalCount: payload.totalCount,
        isBadTerm: payload.isBadTerm,
        isInvalidSearch: payload.isInvalidSearch,
        results,
    }
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.addTag, (state, { tag, index }) => {
    const doc = state.results[index]

    return {
        ...state,
        results: [
            ...state.results.slice(0, index),
            {
                ...doc,
                tags: [...doc.tags, tag],
            },
            ...state.results.slice(index + 1),
        ],
    }
})

reducer.on(acts.delTag, (state, { tag, index }) => {
    const doc = state.results[index]
    const removalIndex = doc.tags.findIndex(val => val === tag)

    if (removalIndex === -1) {
        return state
    }

    return {
        ...state,
        results: [
            ...state.results.slice(0, index),
            {
                ...doc,
                tags: [
                    ...doc.tags.slice(0, removalIndex),
                    ...doc.tags.slice(removalIndex + 1),
                ],
            },
            ...state.results.slice(index + 1),
        ],
    }
})

reducer.on(acts.hideResultItem, (state, url) => {
    const removalIndex = state.results.findIndex(doc => doc.url === url)

    if (removalIndex === -1) {
        return state
    }

    return {
        ...state,
        results: [
            ...state.results.slice(0, removalIndex),
            ...state.results.slice(removalIndex + 1),
        ],
    }
})

reducer.on(acts.changeHasBookmark, (state, index) => {
    const currResult = state.results[index]

    return {
        ...state,
        results: [
            ...state.results.slice(0, index),
            {
                ...currResult,
                hasBookmark: !currResult.hasBookmark,
            },
            ...state.results.slice(index + 1),
        ],
    }
})

reducer.on(acts.resetActiveTagIndex, state => ({
    ...state,
    activeTagIndex: defState.activeTagIndex,
}))

reducer.on(acts.setActiveTagIndex, (state, payload) => ({
    ...state,
    activeTagIndex: payload,
}))

reducer.on(acts.nextPage, state => ({
    ...state,
    currentPage: state.currentPage + 1,
}))
reducer.on(acts.resetPage, state => ({
    ...state,
    currentPage: defState.currentPage,
}))

reducer.on(acts.incSearchCount, state => ({
    ...state,
    searchCount: state.searchCount + 1,
}))

reducer.on(acts.initSearchCount, state => ({
    ...state,
    searchCount: defState.searchCount,
}))

reducer.on(acts.setLoading, (state, payload) => ({
    ...state,
    isLoading: payload,
}))
reducer.on(acts.appendSearchResult, handleSearchResult(false))
reducer.on(acts.setSearchResult, handleSearchResult(true))

export default reducer
