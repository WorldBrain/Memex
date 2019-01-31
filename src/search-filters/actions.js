import { createAction } from 'redux-act'

import { remoteFunction } from 'src/util/webextensionRPC'
import { selectors } from './'
import { results } from '../overview/results/selectors'

export const showTagFilter = createAction('search-filters/showTagFilter')
export const hideTagFilter = createAction('search-filters/hideTagFilter')
export const showDomainFilter = createAction('search-filters/showDomainFilter')
export const hideDomainFilter = createAction('search-filters/hideDomainter')
export const showFilterTypes = createAction('search-filters/showTypeFilters')
export const hideFilterTypes = createAction('search-filters/hideTypeFilters')
export const toggleFilterTypes = createAction(
    'search-filters/toggleFilterTypes',
)

export const addTagFilter = createAction('search-filters/addTagFilter')
export const delTagFilter = createAction('search-filters/delTagFilter')
export const toggleTagFilter = createAction(
    'search-filters/toggleTagFilter',
    a => a,
)
export const addIncDomainFilter = createAction(
    'search-filters/addIncDomainFilter',
)
export const addExcDomainFilter = createAction(
    'search-filters/addExcDomainFilter',
)
export const delIncDomainFilter = createAction(
    'search-filters/delIncDomainFilter',
)
export const delExcDomainFilter = createAction(
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
export const setTagFilters = createAction('search-filters/setTagFilters')
export const setListFilters = createAction('searc-filters/setListFilters')
export const setIncDomainFilters = createAction(
    'search-filters/setIncDomainFilters',
)
export const setExcDomainFilters = createAction(
    'search-filters/setExcDomainFilters',
)

export const resetFilters = createAction('search-filters/resetFilters')
export const showFilter = createAction('search-filters/showFilter')
export const toggleBookmarkFilter = createAction(
    'search-filters/toggleBookmarkFilter',
)

export const addListFilter = createAction('search-filters/addListFilter')
export const delListFilter = createAction('search-filters/delListFilter')
export const toggleListFilter = createAction('search-filters/toggleListFilter')

export const setSuggestedTags = createAction('search-filters/setSuggestedTags')
export const setSuggestedDomains = createAction(
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

export const fetchSuggestedTags = () => async (dispatch, getState) => {
    const filteredTags = selectors.tags(getState())
    const tags = await remoteFunction('extendedSuggest')(filteredTags, 'tag')
    dispatch(setSuggestedTags([...(filteredTags || []), ...tags]))
}

export const fetchSuggestedDomains = () => async (dispatch, getState) => {
    const filteredDomains = selectors.displayDomains(getState())
    const domains = filteredDomains.map(({ value }) => value)
    const suggestedDomains = await remoteFunction('extendedSuggest')(
        domains,
        'domain',
    )

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
