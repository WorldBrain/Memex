import { createAction } from 'redux-act'

import { remoteFunction } from 'src/util/webextensionRPC'
import { selectors } from './'
import { results } from '../overview/results/selectors'
import { User } from 'src/social-integration/types'
import { Thunk } from 'src/options/types'

export const setHashtagFilter = createAction<boolean>(
    'search-filters/setHashtagFilter',
)
export const setUserFilter = createAction<boolean>(
    'search-filters/setUserFilter',
)
export const setTagFilter = createAction<boolean>('search-filters/setTagFilter')
export const setDomainFilter = createAction<boolean>(
    'search-filters/setDomainFilter',
)
export const setMobileListFiltered = createAction<boolean>(
    'search-filters/setMobileListFiltered',
)
export const setDatesFilter = createAction<boolean>(
    'search-filters/setDatesFilter',
)
export const setFilterTypes = createAction<boolean>(
    'search-filters/setFilterTypes',
)
export const addTagFilter = createAction<string>('search-filters/addTagFilter')
export const delTagFilter = createAction<string>('search-filters/delTagFilter')
export const addExcTagFilter = createAction<string>(
    'search-filters/addExcTagFilter',
)
export const delExcTagFilter = createAction<string>(
    'search-filters/delExcTagFilter',
)
export const toggleTagFilter = createAction(
    'search-filters/toggleTagFilter',
    a => a,
)
export const toggleExcTagFilter = createAction(
    'search-filters/toggleExcTagFilter',
    a => a,
)
export const addIncDomainFilter = createAction<string>(
    'search-filters/addIncDomainFilter',
)
export const addExcDomainFilter = createAction<string>(
    'search-filters/addExcDomainFilter',
)
export const delIncDomainFilter = createAction<string>(
    'search-filters/delIncDomainFilter',
)
export const delExcDomainFilter = createAction<string>(
    'search-filters/delExcDomainFilter',
)
export const toggleIncDomainFilter = createAction(
    'search-filters/toggleIncDomainFilter',
    a => a,
)
export const toggleExcDomainFilter = createAction(
    'search-filters/toggleExcDomainFilter',
    a => a,
)
export const setTagFilters = createAction<string[]>(
    'search-filters/setTagFilters',
)
export const setExcTagFilters = createAction<string[]>(
    'search-filters/setExcTagFilters',
)
export const setListFilters = createAction('search-filters/setListFilters')
export const setIncDomainFilters = createAction<string[]>(
    'search-filters/setIncDomainFilters',
)
export const setExcDomainFilters = createAction<string[]>(
    'search-filters/setExcDomainFilters',
)

export const resetFilters = createAction('search-filters/resetFilters')
export const resetFilterPopups = createAction(
    'search-filters/resetFilterPopups',
)
export const showFilter = createAction('search-filters/showFilter')
export const toggleBookmarkFilter = createAction(
    'search-filters/toggleBookmarkFilter',
)

export const addListFilter = createAction('search-filters/addListFilter')
export const delListFilter = createAction('search-filters/delListFilter')
export const toggleListFilter = createAction('search-filters/toggleListFilter')

export const setSuggestedTags = createAction<string[]>(
    'search-filters/setSuggestedTags',
)
export const setSuggestedDomains = createAction<string[]>(
    'search-filters/setSuggestedDomains',
)
export const toggleWebsitesFilter = createAction(
    'search-filters/toggleWebsitesFilter',
)
export const toggleHighlightsFilter = createAction(
    'search-filters/toggleHighlightsFilter',
)
export const toggleNotesFilter = createAction(
    'search-filters/toggleNotesFilter',
)
export const setAnnotationsFilter = createAction<boolean>(
    'search-filters/setAnnotationsFilter',
)
export const clearFilterTypes = createAction('search-filters/clearFilterTypes')
export const toggleFilterBar = createAction('search-filters/toggleFilterBar')
export const setShowFilterBar = createAction<boolean>(
    'search-filters/setShowFilterBar',
)
export const addIncUserFilter = createAction<User>(
    'search-filters/addIncUserFilter',
)
export const delIncUserFilter = createAction<User>(
    'search-filters/delIncUserFilter',
)
export const addExcUserFilter = createAction<User>(
    'search-filters/addExcUserFilter',
)
export const delExcUserFilter = createAction<User>(
    'search-filters/delExcUserFilter',
)
export const setIncUserFilters = createAction<User[]>(
    'search-filters/setIncUserFilters',
)
export const setExcUserFilters = createAction<User[]>(
    'search-filters/setExcUserFilters',
)
export const setSuggestedUsers = createAction<User[]>(
    'search-filters/setSuggestedUsers',
)
export const addIncHashtagFilter = createAction<string>(
    'search-filters/addIncHashtagFilter',
)
export const delIncHashtagFilter = createAction<string>(
    'search-filters/delIncHashtagFilter',
)
export const addExcHashtagFilter = createAction<string>(
    'search-filters/addExcHashtagFilter',
)
export const delExcHashtagFilter = createAction<string>(
    'search-filters/delExcHashtagFilter',
)
export const setIncHashtagFilters = createAction<string[]>(
    'search-filters/setIncHashtagFilters',
)
export const setExcHashtagFilters = createAction<string[]>(
    'search-filters/setExcHashtagFilters',
)
export const setSuggestedHashtags = createAction<string[]>(
    'search-filters/setSuggestedHashags',
)

/**
 * Action to toggle annotation content filter.
 * Toggling it toggles both highlights and notes
 * filter to either true or false.
 */
export const toggleAnnotationsFilter = () => (dispatch, getState) => {
    const state = getState()
    const highlightsFilter = selectors.highlightsFilter(state)
    const notesFilter = selectors.notesFilter(state)

    if (highlightsFilter && notesFilter) {
        dispatch(setAnnotationsFilter(false))
    } else {
        dispatch(setAnnotationsFilter(true))
    }
}

export const fetchSuggestedTags = () => async (dispatch, getState) => {
    const filteredTags = selectors.tags(getState())
    const tags = await remoteFunction('extendedSuggest')({
        notInclude: filteredTags,
        type: 'tag',
    })
    dispatch(setSuggestedTags([...(filteredTags || []), ...tags]))
}

export const fetchSuggestedHashtags = () => async (dispatch, getState) => {
    const filteredHashtags = selectors.displayHashtags(getState())
    const hashtags = filteredHashtags.map(({ value }) => value)
    const suggestedHashtags = await remoteFunction('fetchAllHashtags')({
        excludeIds: hashtags,
    })

    dispatch(
        setSuggestedHashtags([
            ...(filteredHashtags || []),
            ...(suggestedHashtags || []),
        ]),
    )
}

export const fetchSuggestedDomains = () => async (dispatch, getState) => {
    const filteredDomains = selectors.displayDomains(getState())
    const domains = filteredDomains.map(({ value }) => value)
    const suggestedDomains = await remoteFunction('extendedSuggest')({
        notInclude: domains,
        type: 'domain',
    })

    dispatch(
        setSuggestedDomains([
            ...(filteredDomains || []),
            ...(suggestedDomains || []).map(domain => ({
                value: domain,
                isExclusive: false,
            })),
        ]),
    )
}

export const fetchSuggestedUsers: (base64Img?: boolean) => Thunk = (
    base64Img = false,
) => async (dispatch, getState) => {
    const filteredUsers = selectors.displayUsers(getState())
    const userIds = filteredUsers.map(({ value }) => value.id)
    const suggestedUsers: User[] = await remoteFunction('fetchAllUsers')({
        excludeIds: userIds,
        base64Img,
    })

    dispatch(
        setSuggestedUsers([
            ...(filteredUsers || []),
            ...(suggestedUsers || []),
        ]),
    )
}

// Remove tags with no associated paged from filters
export const removeTagFromFilter = () => (dispatch, getState) => {
    const filterTags = selectors.tags(getState()) || []
    if (!filterTags.length) {
        return
    }
    const pages = results(getState())
    const isOnPage = {}
    filterTags.forEach(tag => {
        isOnPage[tag] = false
    })

    pages.forEach(page => {
        filterTags.forEach(tag => {
            if (!isOnPage[tag]) {
                if (page.tags.indexOf(tag) > -1) {
                    isOnPage[tag] = true
                }
            }
        })
    })

    Object.entries(isOnPage).forEach(([key, value]) => {
        if (!value) {
            dispatch(delTagFilter(key))
        }
    })
}
