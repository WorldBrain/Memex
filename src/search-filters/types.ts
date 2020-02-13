export interface ContentTypes {
    pages: boolean
    highlights: boolean
    notes: boolean
}

export interface RootState {
    showTagFilter: boolean
    showDatesFilter: boolean
    showFilterBar: boolean
    showDomainFilter: boolean
    onlyBookmarks: boolean
    popup: string
    tags: string[]
    tagsExc: string[]
    domainsInc: string[]
    domainsExc: string[]
    lists: string
    suggestedTags: string[]
    suggestedDomains: string[]
    contentTypes: ContentTypes
}
