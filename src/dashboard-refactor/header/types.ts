export type FilterKey = 't' | 'd' | 'c' | '-t' | '-d' | '-c' | 'from' | 'to'

export type SearchQueryParsed = SearchQueryPart[]

export interface SearchQueryPart {
    type: 'filter' | 'searchTerms' | 'filterFragment' | 'trailingWhitespace'
    detail?: SearchFilterDetail | SearchTermDetail
}

export interface SearchFilterDetail {
    filterType: FilterList
    filters: string[]
}

interface SearchTermDetail {
    value: string
}

export type FilterList =
    | 'dateFrom'
    | 'dateTo'
    | 'tagsIncluded'
    | 'tagsExcluded'
    | 'domainsIncluded'
    | 'domainsExcluded'
    | 'listsIncluded'
    | 'listsExcluded'

export type SearchFilterType = 'date' | 'tag' | 'domain' | 'list'

export type SearchFilterLabel = 'Date' | 'Tags' | 'Domains' | 'Collections'
