import { SearchInterface } from 'src/search/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { AnnotationInterface } from 'src/direct-linking/background/types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { AnnotationsCacheInterface } from 'src/annotations/annotations-cache'

export interface SidebarContainerDependencies {
    elements?: {
        topBarLeft?: JSX.Element
    }
    pageUrl?: string
    searchResultLimit?: number
    initialState?: 'visible' | 'hidden'
    onClickOutside?: React.MouseEventHandler
    annotationsCache: AnnotationsCacheInterface

    tags: RemoteTagsInterface
    annotations: AnnotationInterface<'caller'>
    customLists: RemoteCollectionsInterface
    // search: SearchInterface
    // bookmarks: BookmarksInterface
}

export type SearchType = 'notes' | 'page' | 'social'
export type PageType = 'page' | 'all'
export interface SearchTypeChange {
    searchType?: 'notes' | 'page' | 'social'
    resultsSearchType?: 'notes' | 'page' | 'social'
    pageType?: 'page' | 'all'
}
