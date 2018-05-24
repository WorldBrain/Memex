import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    showFilters: false,
    onlyBookmarks: false,
    popup: '', // Blank is no popup shown, 'tag' is tags filter, 'domain' is domains filter
    tags: [],
    domainsInc: [],
    domainsExc: [],
}

const addFilter = filterKey => (state, value) => ({
    ...state,
    [filterKey]: [...state[filterKey], value],
    showFilters: true,
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
        showFilters: true,
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
        showFilters: true,
    }
}

const parseStringFilters = str => (str === '' ? [] : str.split(','))

const setFilters = filterKey => (state, filters) => ({
    ...state,
    [filterKey]:
        typeof filters === 'string' ? parseStringFilters(filters) : filters,
    showFilters: true,
})

const toggleBookmarkFilter = state => ({
    ...state,
    onlyBookmarks: !state.onlyBookmarks,
    showFilters: true,
})

const resetFilters = state => ({
    ...defaultState,
    showFilters: state.showFilters,
})

const setPopup = (state, popup = defaultState.popup) => ({
    ...state,
    popup: popup === state.popup ? defaultState.popup : popup,
})

export default createReducer(
    {
        [actions.resetFilters]: resetFilters,
        [actions.setFilterPopup]: setPopup,
        [actions.resetFilterPopup]: setPopup,
        [actions.addTagFilter]: addFilter('tags'),
        [actions.delTagFilter]: delFilter('tags'),
        [actions.toggleTagFilter]: toggleFilter('tags'),
        [actions.addExcDomainFilter]: addFilter('domainsExc'),
        [actions.delExcDomainFilter]: delFilter('domainsExc'),
        [actions.addIncDomainFilter]: addFilter('domainsInc'),
        [actions.delIncDomainFilter]: delFilter('domainsInc'),
        [actions.toggleIncDomainFilter]: toggleFilter('domainsInc'),
        [actions.toggleExcDomainFilter]: toggleFilter('domainsExc'),
        [actions.setTagFilters]: setFilters('tags'),
        [actions.setIncDomainFilters]: setFilters('domainsInc'),
        [actions.setExcDomainFilters]: setFilters('domainsExc'),
        [actions.toggleBookmarkFilter]: toggleBookmarkFilter,
        [actions.showFilter]: state => ({
            ...state,
            showFilters: !state.showFilters,
        }),
    },
    defaultState,
)
