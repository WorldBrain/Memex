import { TaskState } from 'ui-logic-core/lib/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { AnnotationsCacheInterface } from 'src/annotations/annotations-cache'
import { SidebarTheme } from '../types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'

export interface SidebarContainerDependencies {
    elements?: {
        topBarLeft?: JSX.Element
    }
    pageUrl?: string
    pageTitle?: string
    searchResultLimit?: number
    showGoToAnnotationBtn?: boolean
    initialState?: 'visible' | 'hidden'
    onClickOutside?: React.MouseEventHandler
    annotationsCache: AnnotationsCacheInterface

    tags: RemoteTagsInterface
    annotations: AnnotationInterface<'caller'>
    customLists: RemoteCollectionsInterface
    contentSharing: ContentSharingInterface
    theme?: Partial<SidebarTheme>
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
