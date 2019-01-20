import { Annotation } from 'src/sidebar-common/sidebar/types'

export interface Result {
    url: string
    title: string
    tags: string[]
    hasBookmark: boolean
    isDeleting: boolean
    tagPillsData: string[]
    shouldDisplayTagPopup: boolean
    displayTime: number
    screenshot: string
    favIcon: string
    annotations: Annotation[]
}

export interface SearchResult {
    totalCount: number
    resultsExhausted: boolean
    isBadTerm: boolean
    isInvalidSearch: boolean
    docs: Result[]
}

export interface Tooltip {
    title: string
    description: string
}
