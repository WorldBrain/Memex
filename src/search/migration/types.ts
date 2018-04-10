export type ExportedTag = string
export type ExportedBookmark = number
export type ExportedDataURL = string

export interface ExportedPageVisit {
    timestamp: number
    duration?: number
    scrollPx?: number
    scrollPerc?: number
    scrollMaxPx?: number
    scrollMaxPerc?: number
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
