import { Browser } from 'webextension-polyfill-ts'
import { UIEvent } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'

import {
    RootState as SearchResultsState,
    Events as SearchResultEvents,
    NoteDataEventArgs,
    PageEventArgs,
} from './search-results/types'
import {
    RootState as ListsSidebarState,
    Events as ListsSidebarEvents,
} from './lists-sidebar/types'
import {
    RootState as SyncModalState,
    Events as SyncModalEvents,
} from './header/sync-status-menu/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { SearchInterface } from 'src/search/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { Analytics } from 'src/analytics'
import { ActivityIndicatorInterface } from 'src/activity-indicator/background'
import { PublicSyncInterface } from 'src/sync/background/types'
import { BackupInterface } from 'src/backup-restore/background/types'
import { SearchFiltersState, SearchFilterEvents } from './header/types'
import { UIServices } from 'src/services/ui/types'

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
    listsBG: RemoteCollectionsInterface
    searchBG: SearchInterface
    annotationsBG: AnnotationInterface<'caller'>
    activityIndicatorBG: ActivityIndicatorInterface
    copyToClipboard: (text: string) => Promise<boolean>
    localStorage: Browser['storage']['local']
    openFeedUrl: () => void
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
    triggerSuccessfulDropAnimation?: boolean
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
    showBetaFeature?: boolean
    showSubscription?: boolean
    showNoteShareOnboarding?: boolean

    deletingListId?: number
    deletingPageArgs?: PageEventArgs
    deletingNoteArgs?: NoteDataEventArgs
}

export type DashboardModalsEvents = UIEvent<{
    setShareListId: { listId?: number }
    setShowBetaFeatureModal: { isShown: boolean }
    setShowSubscriptionModal: { isShown: boolean }
    setShowNoteShareOnboardingModal: { isShown: boolean }

    setDeletingListId: { listId: number }
    setDeletingPageArgs: PageEventArgs
    setDeletingNoteArgs: NoteDataEventArgs
}>

export type ListSource = 'local-lists' | 'followed-list'
