import Storex, { FindManyOptions } from '@worldbrain/storex'

export type DBGet = () => Promise<Storex>

export type SuggestOptions = FindManyOptions & { includePks?: boolean }
export type SuggestResult<S, P> = Array<{
    collection: string
    suggestion: S
    pk: P
}>

export type VisitInput = number
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
    lists: string[]
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

export interface PageAddRequest {
    pageDoc: PageDoc
    visits: VisitInput[]
    bookmark: BookmarkInput
    rejectNoContent?: boolean
}

export interface PageDoc {
    content: Partial<PageContent>
    url: string
    favIconURI?: string
    screenshotURI?: string
    [extra: string]: any
}

export interface PageContent {
    fullText: string
    title: string
    lang?: string
    canonicalUrl?: string
    description?: string
    keywords?: string[]
}

export interface PipelineReq {
    pageDoc: PageDoc
    rejectNoContent?: boolean
}

export interface PipelineRes {
    url: string

    // Display data
    fullUrl: string
    fullTitle: string

    // Indexed data
    domain: string
    hostname: string
    tags: string[]
    terms: string[]
    urlTerms: string[]
    titleTerms: string[]

    // Misc.
    favIconURI?: string
    screenshotURI?: string
    text: string
}
