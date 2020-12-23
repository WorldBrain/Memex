export type FilterKey = 't' | 'd' | 'c' | '-t' | '-d' | '-c' | 'from' | 'to'

export type SearchQueryPart = QueryFilterPart | QueryTermPart

export interface QueryFilterPart {
    type: 'filter'
    detail: SearchFilterDetail
}

export interface SearchFilterDetail {
    filterType: SearchFilterType
    filters: string[]
    isExclusion?: boolean
    variant?: 'from' | 'to'
}

export interface QueryTermPart {
    type: 'searchTerm'
    detail: { value: string }
}

export type SearchFilterType = 'date' | 'tag' | 'domain' | 'list'

export type SearchFilterLabel = 'Date' | 'Tags' | 'Domains' | 'Collections'
