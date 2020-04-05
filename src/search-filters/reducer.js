import { createReducer } from 'redux-act'

import * as actions from './actions'

/**
 * @typedef {Object} FilterState
 * @property {boolean} showTagFilter Show Filter tag dropdown
 * @property {boolean} showDomainFilter Show domain dropdown in sidebar
 * @property {boolean} showFilterTypes Show filter types in sidebar
 * @property {boolean} showFilterBar REMOVE
 * @property {boolean} onlyBookmarks show only bookmark filters
 * @property {string} popup REMOVE
 * @property {tags} string[] Tags to be filtered
 * @property {domainInc} string[] Domains to included in filtering
 * @property {domainExc} string[]   Domain to be exdluded in filtering
 * @property {lists} string list to be included in filtering
 */

const defaultState = {
    showTagFilter: false,
    showHashtagFilter: false,
    showDatesFilter: false,
    showFilterBar: false,
    showDomainFilter: false,
    showUserFilter: false,
    showFilterTypes: false,
    onlyBookmarks: false,
    isMobileListFiltered: false,
    popup: '', // Blank is no popup shown, 'tag' is tags filter, 'domain' is domains filter
    tags: [],
    tagsExc: [],
    hashtagsInc: [],
    hashtagsExc: [],
    domainsInc: [],
    domainsExc: [],
    usersInc: [],
    usersExc: [],
    // Will contain **ID** only one list for now
    lists: '',
    suggestedTags: [],
    suggestedHashtags: [],
    suggestedDomains: [],
    suggestedUsers: [],

    /* Object way */
    contentTypes: {
        pages: true,
        highlights: true,
        notes: true,
    },
}

const boolReducer = stateKey => (state, payload) => ({
    ...state,
    [stateKey]: payload,
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
        showFilterBar: true,
    }
}

const delFilter = filterKey => (state, value) => {
    if (filterKey === 'lists') {
        return {
            ...state,
            [filterKey]: '',
            isMobileListFiltered: false,
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
        showFilterBar: true,
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
        showFilterBar: true,
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

    newState.showFilterBar =
        newState.tags.length > 0 ||
        newState.tagsExc.length > 0 ||
        newState.domainsExc.length > 0 ||
        newState.domainsInc.length > 0 ||
        newState.usersExc.length > 0 ||
        newState.usersInc.length > 0 ||
        newState.hashtagsInc.length > 0 ||
        newState.hashtagsExc.length > 0 ||
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

const setSuggestedUsers = (state, users) => ({
    ...state,
    suggestedUsers: users,
})

const setSuggestedHashtags = (state, hashtags) => ({
    ...state,
    suggestedHashtags: hashtags,
})

const resetFilters = state => ({
    ...defaultState,
    lists: state.lists,
    showFilterBar: state.showFilterBar,
})

const resetFilterPopups = state => ({
    ...state,
    showDomainFilter: false,
    showTagFilter: false,
    showFilterTypes: false,
    showDatesFilter: false,
})

const toggleListFilter = (state, { id, isMobileListFiltered }) => {
    const removalIndex = state.lists.indexOf(id)

    if (removalIndex === -1) {
        return {
            ...state,
            lists: [id],
            isMobileListFiltered,
        }
    }

    return {
        ...state,
        lists: '',
        isMobileListFiltered: false,
    }
}

export default createReducer(
    {
        [actions.setDomainFilter]: boolReducer('showDomainFilter'),
        [actions.setHashtagFilter]: boolReducer('showHashtagFilter'),
        [actions.setDatesFilter]: boolReducer('showDatesFilter'),
        [actions.setUserFilter]: boolReducer('showUserFilter'),
        [actions.setTagFilter]: boolReducer('showTagFilter'),
        [actions.setFilterTypes]: boolReducer('showFilterTypes'),
        [actions.setShowFilterBar]: boolReducer('showFilterBar'),
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
        [actions.toggleListFilter]: toggleListFilter,
        [actions.addExcDomainFilter]: addFilter('domainsExc'),
        [actions.delExcDomainFilter]: delFilter('domainsExc'),
        [actions.addIncDomainFilter]: addFilter('domainsInc'),
        [actions.delIncDomainFilter]: delFilter('domainsInc'),
        [actions.addExcUserFilter]: addFilter('usersExc'),
        [actions.delExcUserFilter]: delFilter('usersExc'),
        [actions.addIncUserFilter]: addFilter('usersInc'),
        [actions.delIncUserFilter]: delFilter('usersInc'),
        [actions.addIncHashtagFilter]: addFilter('hashtagsInc'),
        [actions.delIncHashtagFilter]: delFilter('hashtagsInc'),
        [actions.addExcHashtagFilter]: addFilter('hashtagsExc'),
        [actions.delExcHashtagFilter]: delFilter('hashtagsExc'),
        [actions.toggleIncDomainFilter]: toggleFilter('domainsInc'),
        [actions.toggleExcDomainFilter]: toggleFilter('domainsExc'),
        [actions.setTagFilters]: setFilters('tags'),
        [actions.setExcTagFilters]: setFilters('tagsExc'),
        [actions.setIncHashtagFilters]: setFilters('hashtagsInc'),
        [actions.setExcHashtagFilters]: setFilters('hashtagsExc'),
        [actions.setListFilters]: setFilters('lists'),
        [actions.setIncDomainFilters]: setFilters('domainsInc'),
        [actions.setExcDomainFilters]: setFilters('domainsExc'),
        [actions.setIncUserFilters]: setFilters('usersInc'),
        [actions.setExcUserFilters]: setFilters('usersExc'),
        [actions.toggleBookmarkFilter]: toggleBookmarkFilter,
        [actions.setSuggestedTags]: setSuggestedTags,
        [actions.setSuggestedDomains]: setSuggestedDomains,
        [actions.setSuggestedUsers]: setSuggestedUsers,
        [actions.setSuggestedHashtags]: setSuggestedHashtags,
        [actions.showFilter]: state => ({
            ...state,
            showFilterBar: !state.showFilterBar,
        }),
        [actions.toggleWebsitesFilter]: toggleWebsitesFilter,
        [actions.toggleHighlightsFilter]: toggleHighlightsFilter,
        [actions.toggleNotesFilter]: toggleNotesFilter,
        [actions.setAnnotationsFilter]: setAnnotationsFilter,
        [actions.clearFilterTypes]: clearFilterTypes,
        [actions.setMobileListFiltered]: (state, isMobileListFiltered) => ({
            ...state,
            isMobileListFiltered,
        }),
    },
    defaultState,
)
