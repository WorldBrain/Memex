import db, { addPage, addTag } from './index'

export type ImportTag = string
export type ImportBookmark = number

export interface ImportVisit {
  duration: number
  scrollPx: number
  scrollPerc: number
  scrollMaxPx: number
  scrollMaxPerc: number
}

export interface ImportPageContent {
  title: string
  fullText: string
}

export interface ImportPage {
  url: string
  content: ImportPageContent
  visits: ImportVisit
  tags: ImportTag[]
  bookmark?: ImportBookmark
}

export async function importPage(page: ImportPage) {
  await addPage({
    pageDoc: {
      content: page.content,
      url: page.url,
    },
    visits: page.visits,
    bookmark: page.bookmark,
  })
  for (const tag of page.tags) {
    await addTag(page.url, tag)
  }
}
