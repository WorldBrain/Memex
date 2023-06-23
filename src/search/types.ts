import Storex, { FindManyOptions } from '@worldbrain/storex'
export * from '@worldbrain/memex-common/lib/page-indexing/types'

export type DBGet = () => Promise<Storex>

export type SuggestOptions = FindManyOptions & {
    /** Define the name of a field to return in case suggest is being performed on a Dexie multi-entry index. */
    multiEntryAssocField?: string
}
export type SuggestResult<S, P> = Array<{
    collection: string
    suggestion: S
    pk: P
}>

export type BookmarkInput = number
export type PageID = string
export type PageScore = number
export type SearchResult = [PageID, PageScore, number]
export type TermsIndexName = 'terms' | 'urlTerms' | 'titleTerms'
export type PageResultsMap = Map<PageID, PageScore>

export interface SearchParams {
    domains: string[]
    domainsExclude: string[]
    tags: string[]
    tagsExc: string[]
    terms: string[]
    termsExclude: string[]
    bookmarks: boolean
    endDate?: number
    startDate?: number
    skip?: number
    limit?: number
    lists: number[]
}

export interface FilteredIDs<T = string> {
    include: Set<T>
    exclude: Set<T>
    isAllowed(url: T): boolean
    isDataFiltered: boolean
}

export interface VisitInteraction {
    duration: number
    scrollPx: number
    scrollPerc: number
    scrollMaxPx: number
    scrollMaxPerc: number
}

export interface SearchIndex {
    search: (params: {
        query: string
        showOnlyBookmarks: boolean
        mapResultsFunc?: any
        domains?: string[]
        domainsExclude?: string[]
        tags?: any[]
        lists?: any[]
        endDate?: number
        startDate?: number
        [key: string]: any
    }) => Promise<{
        docs: any[]
        isBadTerm?: boolean
        requiresMigration?: boolean
        totalCount: number
        resultsExhausted: boolean
    }>
    getMatchingPageCount: (pattern) => Promise<any>
    fullSearch: (
        params: SearchParams,
    ) => Promise<{
        ids: Array<[string, number, number]>
        totalCount: number
    }>

    getPage: (url: string) => Promise<any>
}

export interface PageCreationProps {
    fullUrl: string
    tabId?: number
    allowScreenshot?: boolean
    visitTime?: number | '$now'
}

export interface PageCreationOpts {
    addInboxEntryOnCreate?: boolean
}
