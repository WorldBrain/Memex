export interface ContentTypes {
    pages: boolean
    highlights: boolean
    notes: boolean
}

export interface RootState {
    showTagFilter: boolean
    showDomainFilter: boolean
    showFilters: boolean
    onlyBookmarks: boolean
    popup: string
    tags: string[]
    domainsInc: string[]
    domainsExc: string[]
    lists: string
    suggestedTags: string[]
    suggestedDomains: string[]
    contentTypes: ContentTypes
}
