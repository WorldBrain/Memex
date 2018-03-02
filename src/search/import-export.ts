export type ImportTag = string
export type ImportBookmark = number

export interface ExportedPageVisit {
  duration: number
  scrollPx: number
  scrollPerc: number
  scrollMaxPx: number
  scrollMaxPerc: number
}

export interface ExportedPageContent {
  title: string
  fullText: string
}

export interface ExportedPage {
  url: string
  content: ExportedPageContent
  visits: ExportedPageVisit[]
  tags: ImportTag[]
  bookmark?: ImportBookmark
}
