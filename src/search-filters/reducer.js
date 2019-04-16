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
    showDatesFilter: false,
    showFilterBar: false,
    showDomainFilter: false,
    showFilterTypes: false,
    showFilters: false,
    onlyBookmarks: false,
    popup: '', // Blank is no popup shown, 'tag' is tags filter, 'domain' is domains filter
    tags: [],
    tagsExc: [],
    domainsInc: [],
    domainsExc: [],
    // Will contain **ID** only one list for now
    lists: '',
    suggestedTags: [],
    suggestedDomains: [],

    /* Object way */
    contentTypes: {
        pages: true,
        highlights: true,
        notes: true,
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

const hideDatesFilter = state => ({
    ...state,
    showDatesFilter: false,
})

const showDatesFilter = state => ({
    ...state,
    showDatesFilter: true,
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
        pages: !state.contentTypes.pages,
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
        notes: !state.contentTypes.notes,
    },
})

const toggleFilterBar = state => ({
    ...state,
    showFilterBar: !state.showFilterBar,
})

/**
 * Setting annotations involves setting both notes and highlights
 */
const setAnnotationsFilter = (state, value) => ({
    ...state,
    contentTypes: {
        ...state.contentTypes,
        highlights: value,
        notes: value,
    },
})

const clearFilterTypes = state => ({
    ...state,
    contentTypes: {
        pages: false,
        notes: false,
        highlights: false,
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
        newState.tagsExc.length > 0 ||
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

const resetFilterPopups = state => ({
    ...state,
    showDomainFilter: false,
    showTagFilter: false,
    showFilterTypes: false,
    showDatesFilter: false,
})

export default createReducer(
    {
        [actions.hideDomainFilter]: hideDomainFilter,
        [actions.showDomainFilter]: showDomainFilter,
        [actions.hideDatesFilter]: hideDatesFilter,
        [actions.showDatesFilter]: showDatesFilter,
        [actions.hideTagFilter]: hideTagFilter,
        [actions.showTagFilter]: showTagFilter,
        [actions.showFilterTypes]: showFilterTypes,
        [actions.hideFilterTypes]: hideFilterTypes,
        [actions.toggleFilterTypes]: toggleFilterTypes,
        [actions.toggleFilterBar]: toggleFilterBar,
        [actions.resetFilters]: resetFilters,
        [actions.resetFilterPopups]: resetFilterPopups,
        [actions.addTagFilter]: addFilter('tags'),
        [actions.delTagFilter]: delFilter('tags'),
        [actions.addExcTagFilter]: addFilter('tagsExc'),
        [actions.delExcTagFilter]: delFilter('tagsExc'),
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
        [actions.setExcTagFilters]: setFilters('tagsExc'),
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
        [actions.setAnnotationsFilter]: setAnnotationsFilter,
        [actions.clearFilterTypes]: clearFilterTypes,
    },
    defaultState,
)
