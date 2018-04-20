import { VisitInteraction, Page } from '../search-index-new'

export type ExportedTag = string
export type ExportedBookmark = number
export type ExportedDataURL = string

export interface ExportedPageVisit extends Partial<VisitInteraction> {
    timestamp: number
}

export interface ExportedPage extends Page {
    bookmark: number
    visits: ExportedPageVisit[]
    tags: string[]
    favIconURI?: string
}

export interface OldIndexPage {
    id: string
    terms: Set<string>
    titleTerms: Set<string>
    urlTerms: Set<string>
    visits: Set<string>
    bookmarks: Set<string>
    tags: Set<string>
}
