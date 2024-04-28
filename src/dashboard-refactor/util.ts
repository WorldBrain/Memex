import type { RootState, Events } from './types'
import type {
    TermsSearchOpts,
    UnifiedSearchPaginationParams,
    UnifiedSearchParams,
} from 'src/search/background/types'
import type { PageResult } from './search-results/types'
import {
    initNormalizedState,
    NormalizedState,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { eventProviderDomains } from '@worldbrain/memex-common/lib/constants'
import type {
    PageAnnotationsCacheInterface,
    UnifiedList,
} from 'src/annotations/cache/types'
import { SPECIAL_LIST_STRING_IDS } from './lists-sidebar/constants'
import { SPECIAL_LIST_NAMES } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

export const updatePickerValues = (event: {
    added?: string
    deleted?: string
}) => (prevState: string[]): string[] => {
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

export const getListData = (
    listId: UnifiedList['unifiedId'],
    { listsSidebar }: Pick<RootState, 'listsSidebar'>,
    opts?: { mustBeLocal?: boolean; source?: keyof Events },
): Omit<UnifiedList, 'order'> => {
    // TODO: Deal with these static lists better, without needing to do this
    if (Object.values(SPECIAL_LIST_STRING_IDS).includes(listId)) {
        const name =
            listsSidebar.selectedListId === SPECIAL_LIST_STRING_IDS.INBOX
                ? SPECIAL_LIST_NAMES.INBOX
                : SPECIAL_LIST_NAMES.MOBILE
        return {
            name,
            type: 'special-list',
            pathLocalIds: [],
            pathUnifiedIds: [],
            parentLocalId: null,
            parentUnifiedId: null,
            hasRemoteAnnotationsToLoad: false,
            unifiedAnnotationIds: [],
            unifiedId: listsSidebar.selectedListId,
            localId: parseInt(listsSidebar.selectedListId),
        }
    }

    const listData = listsSidebar.lists.byId[listId]
    const source = opts?.source ? `for ${opts.source} ` : ''

    if (!listData) {
        throw new Error(`Specified list data ${source}could not be found`)
    }
    if (opts?.mustBeLocal && listData.localId == null) {
        throw new Error(
            `Specified list data ${source}could not be found locally`,
        )
    }
    return listData
}

export const stateToSearchParams = (
    {
        searchFilters,
        listsSidebar,
        searchResults,
    }: Pick<RootState, 'listsSidebar' | 'searchFilters' | 'searchResults'>,
    annotationsCache: PageAnnotationsCacheInterface,
): UnifiedSearchParams & UnifiedSearchPaginationParams => {
    const filterByListIds = [...searchFilters.spacesIncluded]
    if (
        Object.values(SPECIAL_LIST_STRING_IDS).includes(
            listsSidebar.selectedListId,
        )
    ) {
        filterByListIds.push(parseInt(listsSidebar.selectedListId))
    } else if (listsSidebar.selectedListId != null) {
        const listData =
            annotationsCache.lists.byId[listsSidebar.selectedListId]
        if (listData?.localId == null) {
            throw new Error(
                `Specified list for search refers to data that does not exist locally`,
            )
        }
        filterByListIds.push(listData.localId!)
    }

    // Blank search doesn't use standard skip+limit pagination. Instead it requires the caller to keep
    //  track of the oldest timestamp and supply that as the new upper-bound on each reinvocation
    const blankSearchUpperBound = !searchFilters.searchQuery.trim().length
        ? searchResults.blankSearchOldestResultTimestamp
        : null

    // TODO: Dynamically set these flags based on state
    const termsSearchOpts: TermsSearchOpts = {
        matchNotes: true,
        matchPageText: true,
        matchHighlights: true,
        matchPageTitleUrl: true,
        matchTermsFuzzyStartsWith: false,
    }

    return {
        skip: searchFilters.skip,
        limit: searchFilters.limit,
        query: searchFilters.searchQuery,
        filterByDomains: searchFilters.domainsIncluded,
        filterByListIds,
        fromWhen: searchFilters.dateFrom,
        untilWhen: blankSearchUpperBound ?? searchFilters.dateTo,
        filterByPDFs: searchResults.searchType === 'pdf',
        filterByEvents: searchResults.searchType === 'events',
        filterByVideos: searchResults.searchType === 'videos',
        filterByTweets: searchResults.searchType === 'twitter',
        omitPagesWithoutAnnotations: searchResults.searchType === 'notes',
        ...termsSearchOpts,
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
