import type { Browser } from 'webextension-polyfill'
import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'

import type {
    RootState as SearchResultsState,
    Events as SearchResultEvents,
    NoteDataEventArgs,
    PageEventArgs,
    PageResult,
} from './search-results/types'
import type {
    RootState as ListsSidebarState,
    Events as ListsSidebarEvents,
} from './lists-sidebar/types'
import type {
    RootState as SyncModalState,
    Events as SyncModalEvents,
} from './header/sync-status-menu/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { SearchInterface } from 'src/search/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type {
    ContentSharingInterface,
    RemoteContentSharingByTabsInterface,
} from 'src/content-sharing/background/types'
import type { Analytics } from 'src/analytics'
import type { ActivityIndicatorInterface } from 'src/activity-indicator/background'
import type { SearchFiltersState, SearchFilterEvents } from './header/types'
import type { UIServices } from 'src/services/ui/types'
import type { ContentConversationsInterface } from 'src/content-conversations/background/types'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import type { PDFRemoteInterface } from 'src/pdf/background/types'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { SummarizationInterface } from 'src/summarization-llm/background'
import type { ContentScriptsInterface } from 'src/content-scripts/background/types'
import type {
    PageAnnotationsCacheInterface,
    RGBAColor,
} from 'src/annotations/cache/types'
import type { PageIndexingInterface } from 'src/page-indexing/background/types'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { ImageSupportInterface } from 'src/image-support/background/types'
import { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import { RemoteBGScriptInterface } from 'src/background-script/types'
import BackgroundScript from 'src/background-script'

export interface RootState {
    loadState: TaskState
    currentUser: AuthenticatedUser | null
    mode: 'search' | 'onboarding'
    syncMenu: SyncModalState
    searchResults: SearchResultsState
    searchFilters: SearchFiltersState
    listsSidebar: ListsSidebarState
    themeVariant: MemexThemeVariant
    modals: DashboardModalsState
    showDropArea: boolean
    activePageID?: string
    activeDay?: number
    multiSelectResults?: any[]
    bulkDeleteLoadingState?: TaskState
    bulkSelectedUrls: string[]
    bulkEditSpacesLoadingState?: TaskState
    highlightColors: string
    isNoteSidebarShown: boolean
    blurEffectReset: boolean
    showFullScreen: boolean
    focusLockUntilMouseStart: boolean
}

export type Events = UIEvent<
    DashboardModalsEvents &
        SearchResultEvents &
        SearchFilterEvents &
        ListsSidebarEvents &
        SyncModalEvents & {
            search: { paginate?: boolean; searchID?: number }
            dragFile: React.DragEvent | null
            dropPdfFile: React.DragEvent
        }
>

export type DashboardDependencies = {
    document: Document
    location: Location
    history: History
    theme: MemexTheme
    analytics: Analytics
    analyticsBG: AnalyticsCoreInterface
    authBG: AuthRemoteFunctionsInterface
    contentShareBG: ContentSharingInterface
    copyPasterBG: RemoteCopyPasterInterface
    contentShareByTabsBG: RemoteContentSharingByTabsInterface<'caller'>
    contentConversationsBG: ContentConversationsInterface
    listsBG: RemoteCollectionsInterface
    searchBG: SearchInterface
    annotationsCache: PageAnnotationsCacheInterface
    contentScriptsBG: ContentScriptsInterface<'caller'>
    annotationsBG: AnnotationInterface<'caller'>
    activityIndicatorBG: ActivityIndicatorInterface
    syncSettingsBG: RemoteSyncSettingsInterface
    pageIndexingBG: PageIndexingInterface<'caller'>
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    summarizeBG: SummarizationInterface<'caller'>
    pdfViewerBG: PDFRemoteInterface
    copyToClipboard: (text: string) => Promise<boolean>
    localStorage: Browser['storage']['local']
    runtimeAPI: Browser['runtime']
    tabsAPI: Browser['tabs']
    openSpaceInWebUI: (remoteCollectionId: string) => void
    renderUpdateNotifBanner: () => JSX.Element
    services: Pick<
        UIServices,
        'logicRegistry' | 'overlay' | 'clipboard' | 'device'
    >
    imageSupportBG: ImageSupportInterface<'caller'>
    closeInPageMode?: () => void
    openSettings?: () => void
    bgScriptBG?: RemoteBGScriptInterface | BackgroundScript
} & (
    | {
          inPageMode: true
          /**
           * This provides the exported text for the page/annotation result that is selected for use
           * in whatever context the dashboard search has been invoked from.
           * TODO: Hook it up to buttons on page/annot results
           */
          onResultSelect: (exportedResultText: string) => void
      }
    | {
          inPageMode?: never
      }
)

export interface DropReceivingState {
    isDraggedOver?: boolean
    wasPageDropped?: boolean
    canReceiveDroppedItems?: boolean
    onDrop(dataTransfer: DataTransfer): void
    onDragEnter(): void
    onDragLeave(): void
}

export interface SearchResultTextPart {
    text: string
    match: boolean
}

export interface DashboardModalsState {
    shareListId?: string
    showLogin?: boolean
    showSubscription?: boolean
    showDisplayNameSetup?: boolean
    showNoteShareOnboarding?: boolean

    deletingListId?: string
    deletingPageArgs?: PageEventArgs
    deletingNoteArgs?: NoteDataEventArgs

    confirmPrivatizeNoteArgs: null | SearchResultEvents['saveNoteEdit']
    confirmSelectNoteSpaceArgs: null | SearchResultEvents['setNoteLists']
}

export type DashboardModalsEvents = UIEvent<{
    setShareListId: { listId?: string }
    setShowLoginModal: { isShown: boolean }
    setShowSubscriptionModal: { isShown: boolean }
    getHighlightColorSettings: null
    saveHighlightColor: {
        noteId: string
        color: RGBAColor | string
        unifiedId: string
    }
    saveHighlightColorSettings: { newState: string }
    setShowDisplayNameSetupModal: { isShown: boolean }
    setShowNoteShareOnboardingModal: { isShown: boolean }

    setDeletingListId: { listId: string }
    setDeletingPageArgs: PageEventArgs
    setDeletingNoteArgs: NoteDataEventArgs
    checkSharingAccess: null
    setSpaceSidebarWidth: { width: string }
    setDisableMouseLeave: { disable: boolean }
    selectAllCurrentItems: null
    clearBulkSelection: null
    setBulkEditSpace: { listId: number }
    changeFocusItem: { direction?: string; pageId?: string }
    setFocusLock: boolean

    setPrivatizeNoteConfirmArgs: DashboardModalsState['confirmPrivatizeNoteArgs']
    setSelectNoteSpaceConfirmArgs: DashboardModalsState['confirmSelectNoteSpaceArgs']
}>

export type ListSource = 'local-lists' | 'followed-lists' | 'joined-lists'
