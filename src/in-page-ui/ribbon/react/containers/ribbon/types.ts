import type { HighlightInteractionsInterface } from 'src/highlighting/types'
import type AnnotationsManager from 'src/annotations/annotations-manager'
import type { BookmarksInterface } from 'src/bookmarks/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { RemoteTagsInterface } from 'src/tags/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { AnnotationsCacheInterface } from 'src/annotations/annotations-cache'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { MaybePromise } from 'src/util/types'
import type { ActivityIndicatorInterface } from 'src/activity-indicator/background'
import type { SyncSettingsStore } from 'src/sync-settings/util'

interface FlagSetterInterface {
    getState(): Promise<boolean>
    setState(value: boolean): Promise<void>
}

export interface RibbonContainerDependencies {
    currentTab: { id?: number; url?: string }
    getPageUrl: () => MaybePromise<string>
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    highlighter: HighlightInteractionsInterface
    annotationsManager: AnnotationsManager
    setSidebarEnabled: (value: boolean) => Promise<void>
    getSidebarEnabled: () => Promise<boolean>
    bookmarks: BookmarksInterface
    customLists: RemoteCollectionsInterface
    activityIndicatorBG: ActivityIndicatorInterface
    tags: RemoteTagsInterface
    contentSharing: ContentSharingInterface
    annotations: AnnotationInterface<'caller'>
    annotationsCache: AnnotationsCacheInterface
    tooltip: FlagSetterInterface
    highlights: FlagSetterInterface
    syncSettings: SyncSettingsStore<'extension'>
}
