import type { Browser } from 'webextension-polyfill'
import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'
import type {
    RootState as SearchResultsState,
    Events as SearchResultEvents,
    NoteDataEventArgs,
    PageEventArgs,
    SelectableBlock,
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
import type { RemoteSearchInterface } from 'src/search/background/types'
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
import type { ImageSupportInterface } from 'src/image-support/background/types'
import type { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import type { RemoteBGScriptInterface } from 'src/background-script/types'
import type { SpaceSearchSuggestion } from '@worldbrain/memex-common/lib/editor'
import type { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'
import type { BulkEditCollection } from 'src/bulk-edit/types'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'
import type { DragEventHandler } from 'react'

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
    bulkSelectedUrls: BulkEditCollection
    bulkEditSpacesLoadingState?: TaskState
    highlightColors: HighlightColor[]
    isNoteSidebarShown: boolean
    blurEffectReset: boolean
    showFullScreen: boolean
    focusLockUntilMouseStart: boolean
    spaceSearchSuggestions: SpaceSearchSuggestion[]
    selectableBlocks: SelectableBlock[]
    focusedBlockId: number | null
}

export type Events = UIEvent<
    DashboardModalsEvents &
        SearchResultEvents &
        SearchFilterEvents &
        ListsSidebarEvents &
        SyncModalEvents & {
            search: { paginate?: boolean } | null
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
    searchBG: RemoteSearchInterface
    personalCloudBG?: PersonalCloudRemoteInterface
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
    browserAPIs: Browser
    tabsAPI: Browser['tabs']
    openSpaceInWebUI: (remoteCollectionId: string) => void
    services: Pick<
        UIServices,
        'logicRegistry' | 'overlay' | 'clipboard' | 'device'
    >
    imageSupportBG: ImageSupportInterface<'caller'>
    closeInPageMode?: () => void
    openSettings?: () => void
    bgScriptBG?: RemoteBGScriptInterface<'caller'>
    getPortalElement?: () => HTMLElement
    openPDFinViewer?: (url: string) => Promise<void>
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
    onDrop(
        dataTransfer: DataTransfer,
        areTargetListChildrenShown?: boolean,
    ): void
    onDragEnter: DragEventHandler
    onDragLeave: DragEventHandler
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
    saveHighlightColorSettings: { newState: HighlightColor[] }
    setShowDisplayNameSetupModal: { isShown: boolean }
    syncNow: { preventUpdateStats?: boolean }
    setShowNoteShareOnboardingModal: { isShown: boolean }

    setDeletingListId: { listId: string }
    setDeletingPageArgs: PageEventArgs & { instaDelete: boolean }
    setDeletingNoteArgs: NoteDataEventArgs
    checkSharingAccess: null
    setSpaceSidebarWidth: { width: string }
    setDisableMouseLeave: { disable: boolean }
    selectAllCurrentItems: null
    clearBulkSelection: null
    setBulkEditSpace: { listId: number }
    changeFocusItem: {
        direction?: string
        item?: {
            id: string
            type: 'page' | 'note'
        }
    }
    setFocusLock: boolean

    setPrivatizeNoteConfirmArgs: DashboardModalsState['confirmPrivatizeNoteArgs']
    setSelectNoteSpaceConfirmArgs: DashboardModalsState['confirmSelectNoteSpaceArgs']
}>

export type ListSource = 'local-lists' | 'followed-lists' | 'joined-lists'
