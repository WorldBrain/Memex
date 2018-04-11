import { VisitInteraction } from '../search-index-new'

export type ExportedTag = string
export type ExportedBookmark = number
export type ExportedDataURL = string

export interface ExportedPageVisit extends Partial<VisitInteraction> {
    timestamp: number
}

export interface ExportedPageContent {
    lang: string
    title: string
    fullText: string
    keywords?: string[]
    description?: string
}

export interface ExportedPage {
    url: string
    content: ExportedPageContent
    visits: ExportedPageVisit[]
    tags: ExportedTag[]
    bookmark?: ExportedBookmark
    screenshot?: ExportedDataURL
    favIcon?: ExportedDataURL
}
