import { Annotation } from 'src/sidebar-overlay/sidebar/types'
import { PageUrlsByDay } from 'src/search/background/types'

export interface Result {
    url: string
    title: string
    pdfFingerprint: string | null
    tags: string[]
    hasBookmark: boolean
    isDeleting: boolean
    tagPillsData: string[]
    shouldDisplayTagPopup: boolean
    displayTime: number
    screenshot: string
    favIcon: string
    annotsCount: number
    annotations: Annotation[]
}

export interface ResultWithIndex extends Result {
    index: number
}

export type ResultsByUrl = Map<string, ResultWithIndex>

export interface SearchResult {
    totalCount: number
    resultsExhausted: boolean
    isBadTerm: boolean
    isInvalidSearch: boolean
    docs: Result[]
    isAnnotsSearch: boolean
    annotsByDay?: PageUrlsByDay
}

export interface Tooltip {
    title: string
    description: string
}
