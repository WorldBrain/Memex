import { createReducer } from 'redux-act'

import * as acts from './actions'
import { SearchResult, Result } from '../types'
import { PageUrlsByDay } from 'src/search/background/types'
import analytics from 'src/analytics'

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
    /** Denotes whether or not to show post-onboarding message. */
    showOnboardingMessage: boolean
    /** Holds the index of the result where the tags popup should be displayed (-1 by default). */
    activeTagIndex: number
    /** Holds the index of the result where the collections popup should be displayed (-1 by default). */
    activeListIndex: number
    /** Holds the index of the result which has the sidebar open (-1 by default) */
    activeSidebarIndex: number
    /** Holds the current page of results that the user has scrolled to (0-based). */
    currentPage: number
    /** Holds the total count of matching results to the current search (includes not-shown results). */
    totalCount: number
    /** Holds the number of searches performed. */
    searchCount: number
    /** Denotes whether annotation lists are expanded by default */
    areAnnotationsExpanded: boolean
    /** Denotes whether the returned results are of the clustered annotations form */
    isAnnotsSearch: boolean
    /** Holds the clustered annots object */
    annotsByDay: PageUrlsByDay
    /** Denotes the type of search performed */
    searchType: 'notes' | 'page' | 'social'
}

export const defaultState: State = {
    results: [],
    resultsExhausted: false,
    isLoading: true,
    isBadTerm: false,
    isInvalidSearch: false,
    activeTagIndex: -1,
    activeListIndex: -1,
    activeSidebarIndex: -1,
    currentPage: 0,
    totalCount: null,
    searchCount: 0,
    areAnnotationsExpanded: false,
    showOnboardingMessage: false,
    isAnnotsSearch: false,
    annotsByDay: null,
    searchType: 'page',
}

const handleSearchResult = (overwrite: boolean) => (
    state: State,
    payload: SearchResult,
): State => {
    const commonState = {
        resultsExhausted: payload.resultsExhausted,
        totalCount: payload.totalCount,
        isBadTerm: payload.isBadTerm,
        isInvalidSearch: payload.isInvalidSearch,
        isAnnotsSearch: payload.isAnnotsSearch,
    }

    if (
        state.searchType === 'social' &&
        payload.docs.every((doc) => !doc.user)
    ) {
        return {
            ...state,
            ...commonState,
        }
    }

    const results = overwrite
        ? payload.docs
        : [...state.results, ...payload.docs]

    const annotsByDay =
        payload.annotsByDay && overwrite
            ? payload.annotsByDay
            : { ...state.annotsByDay, ...payload.annotsByDay }

    return {
        ...state,
        ...commonState,
        results,
        annotsByDay,
    }
}

const reducer = createReducer<State>({}, defaultState)

reducer.on(acts.setShowOnboardingMessage, (state, showOnboardingMessage) => ({
    ...state,
    showOnboardingMessage,
}))

reducer.on(acts.addList, (state, { list, index }) => {
    const doc = state.results[index]

    return {
        ...state,
        results: [
            ...state.results.slice(0, index),
            {
                ...doc,
                lists: [...doc.lists, list],
            },
            ...state.results.slice(index + 1),
        ],
    }
})

reducer.on(acts.delList, (state, { list, index }) => {
    const doc = state.results[index]
    const removalIndex = doc.lists.findIndex((val) => val === list)

    if (removalIndex === -1) {
        return state
    }

    return {
        ...state,
        results: [
            ...state.results.slice(0, index),
            {
                ...doc,
                lists: [
                    ...doc.lists.slice(0, removalIndex),
                    ...doc.lists.slice(removalIndex + 1),
                ],
            },
            ...state.results.slice(index + 1),
        ],
    }
})

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
    analytics.trackEvent({
        category: 'Tags',
        action: 'deleteForPageViaOverview',
    })

    const doc = state.results[index]
    const removalIndex = doc.tags.findIndex((val) => val === tag)

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
    const removalIndex = state.results.findIndex((doc) => doc.url === url)

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

reducer.on(acts.resetActiveTagIndex, (state) => ({
    ...state,
    activeTagIndex: defaultState.activeTagIndex,
}))

reducer.on(acts.resetActiveListIndex, (state) => ({
    ...state,
    activeListIndex: defaultState.activeListIndex,
}))

reducer.on(acts.setActiveTagIndex, (state, payload) => ({
    ...state,
    activeTagIndex: payload,
}))

reducer.on(acts.setActiveListIndex, (state, payload) => ({
    ...state,
    activeListIndex: payload,
}))

reducer.on(acts.resetActiveSidebarIndex, (state) => ({
    ...state,
    activeSidebarIndex: defaultState.activeSidebarIndex,
}))

reducer.on(acts.setActiveSidebarIndex, (state, payload) => ({
    ...state,
    activeSidebarIndex: payload,
}))

reducer.on(acts.setAreAnnotationsExpanded, (state, payload) => ({
    ...state,
    areAnnotationsExpanded: payload,
}))

reducer.on(acts.toggleAreAnnotationsExpanded, (state) => ({
    ...state,
    areAnnotationsExpanded: !state.areAnnotationsExpanded,
}))

reducer.on(acts.nextPage, (state) => ({
    ...state,
    currentPage: state.currentPage + 1,
}))
reducer.on(acts.resetPage, (state) => ({
    ...state,
    currentPage: defaultState.currentPage,
}))

reducer.on(acts.incSearchCount, (state) => ({
    ...state,
    searchCount: state.searchCount + 1,
}))

reducer.on(acts.initSearchCount, (state) => ({
    ...state,
    searchCount: defaultState.searchCount,
}))

reducer.on(acts.setLoading, (state, payload) => ({
    ...state,
    isLoading: payload,
}))
reducer.on(acts.appendSearchResult, handleSearchResult(false))
reducer.on(acts.resetSearchResult, (state) => ({
    ...state,
    resultsExhausted: defaultState.resultsExhausted,
    totalCount: defaultState.totalCount,
    isBadTerm: defaultState.isBadTerm,
    isInvalidSearch: defaultState.isInvalidSearch,
    isAnnotsSearch: defaultState.isAnnotsSearch,
    results: defaultState.results,
    annotsByDay: defaultState.annotsByDay,
}))
reducer.on(acts.setSearchResult, handleSearchResult(true))
reducer.on(acts.setSearchType, (state, searchType) => ({
    ...state,
    searchType,
}))

export default reducer
