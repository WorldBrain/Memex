import { createReducer } from 'redux-act'

import * as actions from './actions'

/**
 * @typedef {Object} FilterState
 * @property {boolean} showTagFilter Show Filter tag dropdown
 * @property {boolean} showDomainFilter Show domain dropdown in sidebar
 * @property {boolean} showFilterTypes Show filter types in sidebar
 * @property {boolean} showFilters REMOVE
 * @property {boolean} onlyBookmarks show only bookmark filters
 * @property {string} popup REMOVE
 * @property {tags} string[] Tags to be filtered
 * @property {domainInc} string[] Domains to included in filtering
 * @property {domainExc} string[]   Domain to be exdluded in filtering
 * @property {lists} string list to be included in filtering
 */

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
    suggestedTags: [],
    suggestedDomains: [],

    /* Object way */
    contentTypes: {
        pages: false,
        highlights: false,
        notes: false,
    },
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

const toggleWebsitesFilter = state => ({
    ...state,
    contentTypes: {
        ...state.contentTypes,
        pages: !state.contentTypes.website,
    },
})

const toggleHighlightsFilter = state => ({
    ...state,
    contentTypes: {
        ...state.contentTypes,
        highlights: !state.contentTypes.highlights,
    },
})

const toggleNotesFilter = state => ({
    ...state,
    contentTypes: {
        ...state.contentTypes,
        notes: !state.contentTypes.website,
    },
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

const setSuggestedTags = (state, tags) => ({
    ...state,
    suggestedTags: tags,
})

const setSuggestedDomains = (state, domains) => ({
    ...state,
    suggestedDomains: domains,
})

const resetFilters = state => ({
    ...defaultState,
    lists: state.lists,
    showFilters: state.showFilters,
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
        [actions.setSuggestedTags]: setSuggestedTags,
        [actions.setSuggestedDomains]: setSuggestedDomains,
        [actions.showFilter]: state => ({
            ...state,
            showFilters: !state.showFilters,
        }),
        [actions.toggleWebsitesFilter]: toggleWebsitesFilter,
        [actions.toggleHighlightsFilter]: toggleHighlightsFilter,
        [actions.toggleNotesFilter]: toggleNotesFilter,
    },
    defaultState,
)
