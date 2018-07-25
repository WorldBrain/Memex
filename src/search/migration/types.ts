import { VisitInteraction } from '..'
import { PageConstructorOptions } from '../models/page'

export type ExportedTag = string
export type ExportedBookmark = number
export type ExportedDataURL = string

export interface ExportedPageVisit extends Partial<VisitInteraction> {
    time: number
}

export interface ExportedPage extends PageConstructorOptions {
    visits: ExportedPageVisit[]
    tags: string[]
    favIconURI?: string
    bookmark: number
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
