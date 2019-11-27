import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { BrowserItem } from './types'

interface AllowTypes {
    [key: string]: boolean | string
}

const normalize = url => normalizeUrl(url)

export interface TestData {
    allowTypes: AllowTypes
    bmUrls: string[]
    histUrls: string[]
    bookmarks: BrowserItem[]
    history: BrowserItem[]
    fakeCacheCounts: any
}

export default function(
    histUrls: string[],
    bmUrls: string[],
    allowTypes?: AllowTypes,
): TestData {
    histUrls = [...new Set(histUrls.map(normalize))]
    bmUrls = [...new Set(bmUrls.map(normalize))]

    let idIt = 0
    const createBrowserItem = type => url =>
        ({ id: idIt++, url, type } as BrowserItem)

    const fakeCacheCounts = {
        completed: { b: 42, h: 13 },
        remaining: { b: 1, h: 27 },
    }

    return {
        allowTypes,
        bmUrls,
        histUrls,
        bookmarks: bmUrls.map(createBrowserItem('b')),
        history: histUrls.map(createBrowserItem('h')),
        fakeCacheCounts,
    }
}

// Gets set diff `a - b`
export const diff = (a = [], b = []) => {
    const checkSet = new Set(b)
    return a.filter(val => !checkSet.has(val))
}
