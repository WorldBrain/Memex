import { BrowserItem } from './types'

export interface TestData {
    bmUrls: string[]
    histUrls: string[]
    bookmarks: BrowserItem[]
    history: BrowserItem[]
    fakeCacheCounts: any
}

export default function(histUrls: string[], bmUrls: string[]): TestData {
    let idIt = 0
    const createBrowserItem = type => url =>
        ({ id: idIt++, url, type } as BrowserItem)

    const fakeCacheCounts = {
        completed: { b: 42, h: 13 },
        remaining: { b: 1, h: 27 },
    }

    return {
        bmUrls,
        histUrls,
        bookmarks: bmUrls.map(createBrowserItem('b')),
        history: histUrls.map(createBrowserItem('h')),
        fakeCacheCounts,
    }
}
