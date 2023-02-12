import type { RootState } from './types'
import type { BackgroundSearchParams } from 'src/search/background/types'
import type { PageResult } from './search-results/types'
import {
    initNormalizedState,
    NormalizedState,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { eventProviderDomains } from '@worldbrain/memex-common/lib/constants'

export const updatePickerValues = <T extends string | number>(event: {
    added?: T
    deleted?: T
}) => (prevState: T[]): T[] => {
    if (event.added) {
        return [...new Set([...prevState, event.added])]
    }
    if (event.deleted) {
        return prevState.filter((tag) => tag !== event.deleted)
    }

    return prevState
}

export const areSearchFiltersEmpty = ({
    listsSidebar,
    searchFilters,
}: Pick<RootState, 'listsSidebar' | 'searchFilters'>): boolean =>
    !listsSidebar.selectedListId &&
    !searchFilters.dateFrom &&
    !searchFilters.dateTo &&
    !searchFilters.domainsExcluded.length &&
    !searchFilters.domainsIncluded.length &&
    !searchFilters.spacesIncluded.length &&
    !searchFilters.tagsExcluded.length &&
    !searchFilters.tagsIncluded.length &&
    !searchFilters.searchQuery.length

function getDomainsFilterIncludeSearchType(searchType) {
    if (searchType === 'videos') {
        return ['youtube.com', 'vimeo.com']
    }

    if (searchType === 'twitter') {
        return ['mobile.twitter.com', 'twitter.com']
    }

    if (searchType === 'events') {
        return eventProviderDomains
    }
}
export const stateToSearchParams = ({
    searchFilters,
    listsSidebar,
    searchResults,
}: Pick<
    RootState,
    'listsSidebar' | 'searchFilters' | 'searchResults'
>): BackgroundSearchParams => {
    const lists = [...searchFilters.spacesIncluded]
    if (listsSidebar.selectedListId != null) {
        lists.push(listsSidebar.selectedListId)
    }

    // Probably Temporary: Add a domain filter for video and twitter type searches
    const searchType = searchResults.searchType
    const domainsFilterIncludeSearchType = getDomainsFilterIncludeSearchType(
        searchType,
    )
    let domainsFilterIncluded
    if (domainsFilterIncludeSearchType != null) {
        if (searchFilters.domainsIncluded != null) {
            domainsFilterIncluded = searchFilters.domainsIncluded.concat(
                domainsFilterIncludeSearchType,
            )
        } else {
            domainsFilterIncluded = domainsFilterIncludeSearchType
        }
    } else {
        domainsFilterIncluded = searchFilters.domainsIncluded
    }

    // Probably Temporary: Add an additional query word for PDFs
    let searchQuery = searchFilters.searchQuery
    if (searchType === 'pdf') {
        searchQuery = searchQuery.concat(' pdf')
    }

    return {
        lists,
        endDate: searchFilters.dateTo,
        startDate: searchFilters.dateFrom,
        query: searchQuery,
        domains: domainsFilterIncluded,
        domainsExclude: searchFilters.domainsExcluded,
        tagsInc: searchFilters.tagsIncluded,
        tagsExc: searchFilters.tagsExcluded,
        limit: searchFilters.limit,
        skip: searchFilters.skip,
    }
}

/**
 * NOTE: This function results in the loss of data. Only use in special cases.
 */
export const flattenNestedResults = ({
    searchResults,
}: Pick<RootState, 'searchResults'>): NormalizedState<PageResult> => {
    const allPageResults = Object.values(searchResults.results).map(
        (a) => a.pages,
    )
    const result = initNormalizedState<PageResult>()

    for (const pages of allPageResults) {
        result.allIds = [...new Set([...result.allIds, ...pages.allIds])]
        for (const pageId in pages.byId) {
            const existing = result.byId[pageId] ?? ({} as PageResult)
            result.byId[pageId] = {
                ...pages.byId[pageId],
                noteIds: {
                    followed: [],
                    search: [],
                    user: [
                        ...new Set([
                            ...(existing?.noteIds?.user ?? []),
                            ...pages.byId[pageId].noteIds.user,
                        ]),
                    ],
                },
            }
        }
    }

    return result
}
