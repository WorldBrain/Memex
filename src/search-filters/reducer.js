import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    showTagFilter: false,
    showDomainFilter: false,
    showFilterTypes: false,
    showFilters: false,
    onlyBookmarks: false,
    popup: '', // Blank is no popup shown, 'tag' is tags filter, 'domain' is domains filter
    tags: [],
    domainsInc: [],
    domainsExc: [],
    // Will contain **ID** only one list for now
    lists: '',
}

const hideDomainFilter = state => ({
    ...state,
    showDomainFilter: false,
})

const showDomainFilter = state => ({
    ...state,
    showDomainFilter: true,
})

const hideTagFilter = state => ({
    ...state,
    showTagFilter: false,
})

const showTagFilter = state => ({
    ...state,
    showTagFilter: true,
})

const hideFilterTypes = state => ({
    ...state,
    showFilterTypes: false,
})

const showFilterTypes = state => ({
    ...state,
    showFilterTypes: true,
})

const toggleFilterTypes = state => ({
    ...state,
    showFilterTypes: !state.showFilterTypes,
})

const addFilter = filterKey => (state, value) => {
    if (filterKey === 'lists') {
        return {
            ...state,
            [filterKey]: value,
        }
    }

    return {
        ...state,
        [filterKey]: [...state[filterKey], value],
        showFilters: true,
    }
}

const delFilter = filterKey => (state, value) => {
    if (filterKey === 'lists') {
        return {
            ...state,
            [filterKey]: '',
        }
    }

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

    if (filterKey === 'lists') {
        return {
            ...state,
            [filterKey]: '',
        }
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

const decideFilters = (filterKey, filters) => {
    if (filterKey === 'lists') {
        return filters
    }

    return typeof filters === 'string' ? parseStringFilters(filters) : filters
}

const setFilters = filterKey => (state, filters) => {
    const newState = {
        ...state,
        [filterKey]: decideFilters(filterKey, filters),
    }

    newState.showFilters =
        newState.tags.length > 0 ||
        newState.domainsExc.length > 0 ||
        newState.domainsInc.length > 0 ||
        newState.onlyBookmarks

    return newState
}

const toggleBookmarkFilter = state => ({
    ...state,
    onlyBookmarks: !state.onlyBookmarks,
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
        [actions.hideDomainFilter]: hideDomainFilter,
        [actions.showDomainFilter]: showDomainFilter,
        [actions.hideTagFilter]: hideTagFilter,
        [actions.showTagFilter]: showTagFilter,
        [actions.showFilterTypes]: showFilterTypes,
        [actions.hideFilterTypes]: hideFilterTypes,
        [actions.toggleFilterTypes]: toggleFilterTypes,
        [actions.resetFilters]: resetFilters,
        [actions.setFilterPopup]: setPopup,
        [actions.resetFilterPopup]: setPopup,
        [actions.addTagFilter]: addFilter('tags'),
        [actions.delTagFilter]: delFilter('tags'),
        [actions.toggleTagFilter]: toggleFilter('tags'),
        [actions.addListFilter]: addFilter('lists'),
        [actions.delListFilter]: delFilter('lists'),
        [actions.toggleListFilter]: toggleFilter('lists'),
        [actions.addExcDomainFilter]: addFilter('domainsExc'),
        [actions.delExcDomainFilter]: delFilter('domainsExc'),
        [actions.addIncDomainFilter]: addFilter('domainsInc'),
        [actions.delIncDomainFilter]: delFilter('domainsInc'),
        [actions.toggleIncDomainFilter]: toggleFilter('domainsInc'),
        [actions.toggleExcDomainFilter]: toggleFilter('domainsExc'),
        [actions.setTagFilters]: setFilters('tags'),
        [actions.setListFilters]: setFilters('lists'),
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
