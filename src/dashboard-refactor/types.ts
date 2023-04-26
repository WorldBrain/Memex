import type { Browser } from 'webextension-polyfill'
import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'

import type {
    RootState as SearchResultsState,
    Events as SearchResultEvents,
    NoteDataEventArgs,
    PageEventArgs,
} from './search-results/types'
import type {
    RootState as ListsSidebarState,
    Events as ListsSidebarEvents,
} from './lists-sidebar/types'
import type {
    RootState as SyncModalState,
    Events as SyncModalEvents,
} from './header/sync-status-menu/types'
import type { RemoteTagsInterface } from 'src/tags/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { SearchInterface } from 'src/search/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { Analytics } from 'src/analytics'
import type { ActivityIndicatorInterface } from 'src/activity-indicator/background'
import type { BackupInterface } from 'src/backup-restore/background/types'
import type { SearchFiltersState, SearchFilterEvents } from './header/types'
import type { UIServices } from 'src/services/ui/types'
import type { ContentConversationsInterface } from 'src/content-conversations/background/types'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import type { PDFRemoteInterface } from 'src/pdf/background/types'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { SummarizationInterface } from 'src/summarization-llm/background'
import type { ContentScriptsInterface } from 'src/content-scripts/background/types'
import type { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'

export interface RootState {
    loadState: TaskState
    currentUser: AuthenticatedUser | null
    mode: 'search' | 'onboarding'
    syncMenu: SyncModalState
    searchResults: SearchResultsState
    searchFilters: SearchFiltersState
    listsSidebar: ListsSidebarState
    modals: DashboardModalsState
    showDropArea: boolean
    activePageID?: string
    activeDay?: number
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

export interface DashboardDependencies {
    document: Document
    location: Location
    analytics: Analytics
    tagsBG: RemoteTagsInterface
    authBG: AuthRemoteFunctionsInterface
    backupBG: BackupInterface<'caller'>
    contentShareBG: ContentSharingInterface
    contentConversationsBG: ContentConversationsInterface
    listsBG: RemoteCollectionsInterface
    searchBG: SearchInterface
    annotationsCache: PageAnnotationsCacheInterface
    contentScriptsBG: ContentScriptsInterface<'caller'>
    annotationsBG: AnnotationInterface<'caller'>
    activityIndicatorBG: ActivityIndicatorInterface
    syncSettingsBG: RemoteSyncSettingsInterface
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    summarizeBG: SummarizationInterface<'caller'>
    pdfViewerBG: PDFRemoteInterface
    copyToClipboard: (text: string) => Promise<boolean>
    localStorage: Browser['storage']['local']
    runtimeAPI: Browser['runtime']
    tabsAPI: Browser['tabs']
    openFeed: () => void
    openCollectionPage: (remoteCollectionId: string) => void
    renderUpdateNotifBanner: () => JSX.Element
    services: Pick<
        UIServices,
        'logicRegistry' | 'overlay' | 'clipboard' | 'device'
    >
}

export interface DropReceivingState {
    isDraggedOver?: boolean
    canReceiveDroppedItems?: boolean
    wasPageDropped?: boolean
    onDrop(dataTransfer: DataTransfer): void
    onDragEnter(): void
    onDragLeave(): void
}

export interface SearchResultTextPart {
    text: string
    match: boolean
}

export interface DashboardModalsState {
    shareListId?: number
    showLogin?: boolean
    showSubscription?: boolean
    showDisplayNameSetup?: boolean
    showNoteShareOnboarding?: boolean

    deletingListId?: number
    deletingPageArgs?: PageEventArgs
    deletingNoteArgs?: NoteDataEventArgs

    confirmPrivatizeNoteArgs: null | SearchResultEvents['saveNoteEdit']
    confirmSelectNoteSpaceArgs: null | SearchResultEvents['setNoteLists']
}

export type DashboardModalsEvents = UIEvent<{
    setShareListId: { listId?: number }
    setShowLoginModal: { isShown: boolean }
    setShowSubscriptionModal: { isShown: boolean }
    setShowDisplayNameSetupModal: { isShown: boolean }
    setShowNoteShareOnboardingModal: { isShown: boolean }

    setDeletingListId: { listId: number }
    setDeletingPageArgs: PageEventArgs
    setDeletingNoteArgs: NoteDataEventArgs
    checkSharingAccess: null
    setSpaceSidebarWidth: { width: number }

    setPrivatizeNoteConfirmArgs: DashboardModalsState['confirmPrivatizeNoteArgs']
    setSelectNoteSpaceConfirmArgs: DashboardModalsState['confirmSelectNoteSpaceArgs']
}>

export type ListSource = 'local-lists' | 'followed-lists' | 'joined-lists'
