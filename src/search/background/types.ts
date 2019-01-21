export interface AnnotSearchParams {
    /** Main text terms to search against annot body/comments. */
    terms?: string[]
    /** Collections to include (all results must be of pages in this collection). */
    collections?: string[]
    /** Tags to include (all results must have these tags). */
    tagsInc?: string[]
    /** Tags to exclude (no results can have these tags). */
    tagsExc?: string[]
    /** Same idea as tags, but for domains (['google.com', 'twitter.com']). */
    domainsInc?: string[]
    domainsExc?: string[]
    /** Lower-bound for time filter (all results must be created AFTER this time). */
    startDate?: Date | number
    /** Upper-bound for time filter (all results must be created BEFORE this time). */
    endDate?: Date | number
    /** If defined, confines search to a particular page. */
    url?: string
    /** Use for pagination (result skip may not be possible). */
    limit?: number
    /** Denotes whether or not to limit search to annotations on a bookmarked page. */
    bookmarksOnly?: boolean
    /** Denotes whether or not to limit search to highlighted text (body). */
    highlightsOnly?: boolean
    /** Denotes whether or not to limit search to direct links. */
    directLinksOnly?: boolean
    /** Denotes whether or not to return the assoc. pages with matched annots. */
    includePageResults?: boolean
}

export interface UrlFilters {
    collUrlsInc?: Set<string>
    tagUrlsInc?: Set<string>
    domainUrlsInc?: Set<string>
    tagUrlsExc?: Set<string>
    domainUrlsExc?: Set<string>
}

export interface AnnotListParams {
    /** URL of a particular page to list annots for. */
    url: string
    limit?: number
    skip?: number
}
