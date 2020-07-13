import { HighlightInteractionsInterface } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { AnnotationInterface } from 'src/direct-linking/background/types'
import { ActivityLoggerInterface } from 'src/activity-logger/background/types'

interface FlagSetterInterface {
    getState(): Promise<boolean>
    setState(value: boolean): Promise<void>
}

export interface RibbonContainerDependencies {
    currentTab: { id: number; url: string }
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    highlighter: HighlightInteractionsInterface
    annotationsManager: AnnotationsManager
    setSidebarEnabled: (value: boolean) => Promise<void>
    getSidebarEnabled: () => Promise<boolean>
    bookmarks: BookmarksInterface
    customLists: RemoteCollectionsInterface
    tags: RemoteTagsInterface
    annotations: AnnotationInterface<'caller'>
    activityLogger: ActivityLoggerInterface
    tooltip: FlagSetterInterface
    highlights: FlagSetterInterface
}
