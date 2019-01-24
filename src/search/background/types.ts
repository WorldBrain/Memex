import { StorageManager } from '..'
import { Annotation } from 'src/direct-linking/types'

export interface AnnotPage {
    url: string
    title: string
    hasBookmark: boolean
    /** Object URL to the in-memory location of the assoc. screenshot. */
    screenshot?: string
    /** Object URL to the in-memory location of the assoc. fav-icon. */
    favIcon?: string
    annotations: Annotation[]
}

export interface AnnotSearchParams {
    /** Main text to search against annot (pre-processed). */
    query?: string
    /** Main text terms to search against annot (post-processed). */
    termsInc?: string[]
    termsExc?: string[]
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
    skip?: number
    /** Denotes whether or not to limit search to annotations on a bookmarked page. */
    bookmarksOnly?: boolean
    /** Denotes whether or not to limit search to highlighted text (body). */
    highlightsOnly?: boolean
    /** Denotes whether or not to limit search to direct links. */
    directLinksOnly?: boolean
    /** Denotes whether or not to return the assoc. pages with matched annots. */
    includePageResults?: boolean
}

export interface PageSearchParams extends AnnotSearchParams {
    contentTypes: ContentTypes
}

export interface ContentTypes {
    pages: boolean
    notes: boolean
    highlights: boolean
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

export abstract class Searcher<Params, Result> {
    constructor(protected storageManager: StorageManager) {}

    abstract search(params: Params): Promise<Result[]>
}
