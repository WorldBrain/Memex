import type { Browser } from 'webextension-polyfill-ts'
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
import type { PublicSyncInterface } from 'src/sync/background/types'
import type { BackupInterface } from 'src/backup-restore/background/types'
import type { SearchFiltersState, SearchFilterEvents } from './header/types'
import type { UIServices } from 'src/services/ui/types'
import type { ContentConversationsInterface } from 'src/content-conversations/background/types'

export interface RootState {
    loadState: TaskState
    syncMenu: SyncModalState
    searchResults: SearchResultsState
    searchFilters: SearchFiltersState
    listsSidebar: ListsSidebarState
    modals: DashboardModalsState
}

export type Events = UIEvent<
    DashboardModalsEvents &
        SearchResultEvents &
        SearchFilterEvents &
        ListsSidebarEvents &
        SyncModalEvents & {
            search: { paginate?: boolean }
        }
>

export interface DashboardDependencies {
    document: Document
    location: Location
    analytics: Analytics
    tagsBG: RemoteTagsInterface
    authBG: AuthRemoteFunctionsInterface
    syncBG: PublicSyncInterface
    backupBG: BackupInterface<'caller'>
    contentShareBG: ContentSharingInterface
    contentConversationsBG: ContentConversationsInterface
    listsBG: RemoteCollectionsInterface
    searchBG: SearchInterface
    annotationsBG: AnnotationInterface<'caller'>
    activityIndicatorBG: ActivityIndicatorInterface
    copyToClipboard: (text: string) => Promise<boolean>
    localStorage: Browser['storage']['local']
    openFeed: () => void
    openCollectionPage: (remoteCollectionId: string) => void
    renderDashboardSwitcherLink: () => JSX.Element
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

export interface HoverState {
    onHoverEnter(id: number): void
    onHoverLeave(id: number): void
    isHovered: boolean
}

export interface SelectedState {
    onSelection(id: number, isActive?: boolean): void
    isSelected: boolean
}

export interface DashboardModalsState {
    shareListId?: number
    showLogin?: boolean
    showBetaFeature?: boolean
    showSubscription?: boolean
    showNoteShareOnboarding?: boolean

    deletingListId?: number
    deletingPageArgs?: PageEventArgs
    deletingNoteArgs?: NoteDataEventArgs
}

export type DashboardModalsEvents = UIEvent<{
    setShareListId: { listId?: number }
    setShowLoginModal: { isShown: boolean }
    setShowBetaFeatureModal: { isShown: boolean }
    setShowSubscriptionModal: { isShown: boolean }
    setShowNoteShareOnboardingModal: { isShown: boolean }

    setDeletingListId: { listId: number }
    setDeletingPageArgs: PageEventArgs
    setDeletingNoteArgs: NoteDataEventArgs
    checkSharingAccess: null
}>

export type ListSource = 'local-lists' | 'followed-lists'
