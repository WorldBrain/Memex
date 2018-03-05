export type ImportTag = string
export type ImportBookmark = number

export interface ExportedPageVisit {
  timestamp: number
  duration?: number
  scrollPx?: number
  scrollPerc?: number
  scrollMaxPx?: number
  scrollMaxPerc?: number
}

export interface ExportedPageContent {
  lang: string,
  title: string
  fullText: string,
  keywords: string,
  description: string
}

export interface ExportedPage {
  url: string
  content: ExportedPageContent
  visits: ExportedPageVisit[]
  tags: ImportTag[]
  bookmark?: ImportBookmark
  screenshot?: string // data URL
}
