import { Annotation } from 'src/direct-linking/types'
import { User } from 'src/social-integration/types'

export interface AnnotPage {
    url: string
    title?: string
    hasBookmark: boolean
    /** Object URL to the in-memory location of the assoc. screenshot. */
    screenshot?: string
    /** Object URL to the in-memory location of the assoc. fav-icon. */
    favIcon?: string
    displayTime?: number
    /** Total count of annots associated with this page. (regardless of search) */
    annotsCount: number
    annotations: Annotation[]
    pageId?: string
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
    /** Denotes whether or not to include highlighted text (body) in search. */
    includeHighlights?: boolean
    /** Denotes whether or not to include comments/notes in search. */
    includeNotes?: boolean
    /** Denotes whether or not to include direct links in search. */
    includeDirectLinks?: boolean
    /** Denotes whether or not to return the assoc. pages with matched annots. */
    includePageResults?: boolean
    /** If set, encodes any images as base64 strings rather than Object URL refs. */
    base64Img?: boolean
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

/**
 * Maps day (start of day timestamp) to list of pages that have annots created/edited
 * on that day.
 */
export interface PageUrlsByDay {
    [day: number]: AnnotsByPageUrl
}

/**
 * Maps page URLs to pages containing list of annotations created/edited on that day.
 */
export interface PagesByUrl {
    [pageUrl: string]: AnnotPage
}

export interface AnnotsByPageUrl {
    [pageUrl: string]: Annotation[]
}

export interface SocialSearchParams extends AnnotSearchParams {
    usersInc?: User[]
    usersExc?: User[]
    hashtagsInc?: string[]
    hashtagsExc?: string[]
}
