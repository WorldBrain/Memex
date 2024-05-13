import type { HighlightRendererInterface } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/types'
import type { BookmarksInterface } from 'src/bookmarks/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { MaybePromise } from 'src/util/types'
import type { ActivityIndicatorInterface } from 'src/activity-indicator/background'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { RemoteBGScriptInterface } from 'src/background-script/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { RemoteSearchInterface } from 'src/search/background/types'
import { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { Browser } from 'webextension-polyfill'

interface FlagSetterInterface {
    getState(): Promise<boolean>
    setState(value: boolean): Promise<void>
}

export interface RibbonContainerDependencies {
    currentTab: { id?: number; url?: string }
    getFullPageUrl: () => MaybePromise<string>
    highlighter: HighlightRendererInterface
    setSidebarEnabled: (value: boolean) => Promise<void>
    getSidebarEnabled: () => Promise<boolean>
    bookmarks: BookmarksInterface
    customLists: RemoteCollectionsInterface
    activityIndicatorBG: ActivityIndicatorInterface
    authBG: AuthRemoteFunctionsInterface
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    contentSharing: ContentSharingInterface
    annotations: AnnotationInterface<'caller'>
    annotationsCache: PageAnnotationsCacheInterface
    bgScriptBG: RemoteBGScriptInterface
    searchBG: RemoteSearchInterface
    tooltip: FlagSetterInterface
    highlights: FlagSetterInterface
    syncSettingsBG: RemoteSyncSettingsInterface
    syncSettings: SyncSettingsStore<
        'extension' | 'inPageUI' | 'activityIndicator'
    >
    currentUser?: UserReference
    getRootElement: () => HTMLElement
    openPDFinViewer: (url: string) => Promise<void>
    events: AnnotationsSidebarInPageEventEmitter
    browserAPIs: Browser
}
