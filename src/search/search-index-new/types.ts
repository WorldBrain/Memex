export interface SearchParams {
    domains: string[]
    tags: string[]
    queryTerms: string[]
    endDate?: number
    startDate?: number
    skip: number
    limit: number
}

export type PageID = string
export type PageScore = number
export type SearchResult = [PageID, PageScore]
