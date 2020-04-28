import { HighlightInteractionInterface } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { CustomListsInterface } from 'src/custom-lists/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { AnnotationInterface } from 'src/direct-linking/background/types'

export interface RibbonContainerDependencies {
    currentTab: { id: number; url: string }
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    highlighter: Pick<HighlightInteractionInterface, 'removeHighlights'>
    annotationsManager: AnnotationsManager
    setSidebarEnabled: (value: boolean) => Promise<void>
    getSidebarEnabled: () => Promise<boolean>
    bookmarks: BookmarksInterface
    customLists: CustomListsInterface
    tags: RemoteTagsInterface
    annotations: AnnotationInterface<'caller'>
}
