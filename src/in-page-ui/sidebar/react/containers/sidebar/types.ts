import { URLNormalizer } from '@worldbrain/memex-url-utils'

import { AnnotationsManagerInterface } from 'src/annotations/types'
import { SearchInterface } from 'src/search/background/types'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { AnnotationInterface } from 'src/direct-linking/background/types'
import { BookmarksInterface } from 'src/bookmarks/background/types'

export interface SidebarContainerDependencies {
    inPageUI: InPageUIInterface
    annotationsManager: AnnotationsManagerInterface
    currentTab: { id: number; url: string }
    normalizeUrl: URLNormalizer
    highlighter: Pick<
        HighlightInteractionInterface,
        'removeTempHighlights' | 'removeAnnotationHighlights'
    >

    tags: RemoteTagsInterface
    annotations: AnnotationInterface<'caller'>
    customLists: RemoteCollectionsInterface
    search: SearchInterface
    bookmarks: BookmarksInterface
}
