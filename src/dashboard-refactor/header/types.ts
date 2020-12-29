export type FilterKey = 't' | 'd' | 'c' | '-t' | '-d' | '-c' | 'from' | 'to'

export type SearchQueryPart = QueryFilterPart | QueryStringPart | undefined

export interface QueryFilterPart {
    type: 'filter'
    detail: SearchFilterDetail
}

export interface SearchFilterDetail {
    filterType: SearchFilterType
    rawContent: string
    filters: string[]
    isExclusion?: boolean
    variant?: 'from' | 'to'
    lastFilterIncompleteQuote?: boolean
}

export interface QueryStringPart {
    type: 'queryString'
    detail: { value: string }
}

export type SearchFilterType = 'date' | 'tag' | 'domain' | 'list'

export type SearchFilterLabel = 'Date' | 'Tags' | 'Domains' | 'Collections'
