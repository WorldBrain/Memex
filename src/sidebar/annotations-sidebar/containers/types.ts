import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'
import type {
    AnnotationConversationEvent,
    AnnotationConversationsState,
} from '@worldbrain/memex-common/lib/content-conversations/ui/types'
import type { RemoteTagsInterface } from 'src/tags/background/types'
import type {
    RemoteCollectionsInterface,
    SharedAnnotationList,
} from 'src/custom-lists/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { SidebarTheme } from '../types'
import type {
    AnnotationSharingStates,
    ContentSharingInterface,
} from 'src/content-sharing/background/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { Analytics } from 'src/analytics'
import type { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import type { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import type { ContentScriptsInterface } from 'src/content-scripts/background/types'
import type { AnnotationSharingAccess } from 'src/content-sharing/ui/types'
import type { AnnotationsSorter } from '../sorting'
import type { Annotation } from 'src/annotations/types'
import type { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import type { Anchor } from 'src/highlighting/types'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { ContentConversationsInterface } from 'src/content-conversations/background/types'
import type { MaybePromise } from 'src/util/types'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { MemexTheme } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import type {
    PageAnnotationsCacheInterface,
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'

export interface SidebarContainerDependencies {
    elements?: {
        topBarLeft?: JSX.Element
    }
    fullPageUrl?: string
    getFullPageUrl: () => MaybePromise<string>
    pageTitle?: string
    searchResultLimit?: number
    showGoToAnnotationBtn?: boolean
    initialState?: 'visible' | 'hidden'
    onClickOutside?: React.MouseEventHandler
    annotationsCache: PageAnnotationsCacheInterface
    showAnnotationShareModal?: () => void
    sidebarContext: 'dashboard' | 'in-page' | 'pdf-viewer'

    tags: RemoteTagsInterface
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    annotations: AnnotationInterface<'caller'>
    customLists: RemoteCollectionsInterface
    contentSharing: ContentSharingInterface
    contentConversationsBG: ContentConversationsInterface
    syncSettingsBG: RemoteSyncSettingsInterface
    auth: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
    theme?: MemexTheme & Partial<SidebarTheme>

    currentUser?: UserReference
    // search: SearchInterface
    // bookmarks: BookmarksInterface
    analytics: Analytics
    copyToClipboard: (text: string) => Promise<boolean>
    copyPaster: RemoteCopyPasterInterface
    contentScriptBackground: ContentScriptsInterface<'caller'>
}

export interface EditForm {
    isBookmarked: boolean
    commentText: string
    lists: number[]
}

export interface EditForms {
    [annotationUrl: string]: EditForm
}

export type AnnotationEventContext = 'pageAnnotations' | 'searchResults'
export type SearchType = 'notes' | 'page' | 'social'
export type PageType = 'page' | 'all'
export interface SearchTypeChange {
    searchType?: 'notes' | 'page' | 'social'
    resultsSearchType?: 'notes' | 'page' | 'social'
    pageType?: 'page' | 'all'
}

export interface FollowedListAnnotation {
    id: string
    /** Only should be defined if annotation belongs to local user. */
    localId: string | null
    body?: string
    comment?: string
    selector?: Anchor
    createdWhen: number
    updatedWhen?: number
    creatorId: string
}

export type SidebarTab = 'annotations' | 'spaces' | 'feed'

export type ListPickerShowState =
    | { annotationId: string; position: 'footer' | 'lists-bar' }
    | undefined

export type FollowedListState = SharedAnnotationList & {
    isExpanded: boolean
    isContributable: boolean
    annotationEditForms: EditForms
    annotationsLoadState: TaskState
    conversationsLoadState: TaskState
    activeShareMenuAnnotationId: string | undefined
    activeCopyPasterAnnotationId: string | undefined
    annotationModes: { [annotationId: string]: AnnotationMode }
    activeListPickerState: ListPickerShowState
}

interface SidebarFollowedListsState {
    followedListLoadState: TaskState
    followedLists: NormalizedState<FollowedListState>
    followedAnnotations: { [annotationId: string]: FollowedListAnnotation }

    users: {
        [userId: string]: {
            name: string
            profileImgSrc?: string
        }
    }
}

export interface SidebarContainerState
    extends SidebarFollowedListsState,
        AnnotationConversationsState {
    loadState: TaskState
    noteCreateState: TaskState
    annotationsLoadState: TaskState
    secondarySearchState: TaskState

    showState: 'visible' | 'hidden'
    isLocked: boolean
    isWidthLocked: boolean

    activeTab: SidebarTab
    pillVisibility: string

    sidebarWidth?: string

    // Indicates what is the currently selected space in the leaf screen
    // for the side bar, also known as the isolated view. When a space
    // is selected, all operations default to use that selected space
    // except if explicity told otherwise.
    selectedListId: UnifiedList['unifiedId'] | null

    annotationSharingAccess: AnnotationSharingAccess

    showAllNotesCopyPaster: boolean
    activeCopyPasterAnnotationId: string | undefined
    activeTagPickerAnnotationId: string | undefined
    activeListPickerState: ListPickerShowState

    pageUrl?: string
    lists: PageAnnotationsCacheInterface['lists']
    annotations: PageAnnotationsCacheInterface['annotations']
    annotationModes: {
        [context in AnnotationEventContext]: {
            [annotationUrl: string]: AnnotationMode
        }
    }
    activeAnnotationId: UnifiedAnnotation['unifiedId'] | null

    listInstances: { [unifiedListId: UnifiedList['unifiedId']]: ListInstance }
    annotationCardInstances: { [instanceId: string]: AnnotationCardInstance }

    showCommentBox: boolean
    commentBox: EditForm

    editForms: EditForms

    pageCount: number
    noResults: boolean

    showCongratsMessage: boolean
    showClearFiltersBtn: boolean

    // Filter sidebar props
    showFiltersSidebar: boolean
    showSocialSearch: boolean
    shouldShowTagsUIs: boolean

    annotCount?: number

    // Search result props
    shouldShowCount: boolean
    isInvalidSearch: boolean
    totalResultCount: number
    searchResultSkip: number

    isListFilterActive: boolean
    showLoginModal: boolean
    showDisplayNameSetupModal: boolean
    showAnnotationsShareModal: boolean
    popoutsActive: boolean

    confirmPrivatizeNoteArgs: null | SidebarEvents['editAnnotation']
    confirmSelectNoteSpaceArgs: null | SidebarEvents['updateListsForAnnotation']

    showAllNotesShareMenu: boolean
    activeShareMenuNoteId: string | undefined
    immediatelyShareNotes: boolean
}

export type AnnotationEvent<T> = {
    unifiedAnnotationId: UnifiedAnnotation['unifiedId']
} & T

export type AnnotationCardInstanceEvent<T> = {
    instanceLocation: UnifiedList['unifiedId'] | 'annotations-tab'
} & AnnotationEvent<T>

interface SidebarEvents {
    show: { existingWidthState: string }
    hide: null
    lock: null
    unlock: null
    lockWidth: null
    unlockWidth: null
    adjustSidebarWidth: { newWidth: string; isWidthLocked?: boolean }
    setPopoutsActive: boolean

    setActiveSidebarTab: { tab: SidebarTab }
    sortAnnotations: { sortingFn: AnnotationsSorter }
    receiveSharingAccessChange: {
        sharingAccess: AnnotationSharingAccess
    }

    // New page note box
    setNewPageNoteText: { comment: string }
    saveNewPageNote: {
        shouldShare: boolean
        isProtected?: boolean
        now?: number
    }
    cancelNewPageNote: null
    setNewPageNoteLists: { lists: number[] }

    // Annotation card instance events
    setAnnotationEditCommentText: AnnotationCardInstanceEvent<{
        comment: string
    }>
    setAnnotationCardMode: AnnotationCardInstanceEvent<{
        mode: AnnotationCardMode
    }>
    setAnnotationEditMode: AnnotationCardInstanceEvent<{ isEditing: boolean }>
    setAnnotationCommentMode: AnnotationCardInstanceEvent<{
        isTruncated: boolean
    }>
    editAnnotation: AnnotationCardInstanceEvent<{
        shouldShare: boolean
        isProtected?: boolean
        mainBtnPressed?: boolean
        keepListsIfUnsharing?: boolean
        now?: number
    }>

    // Annotation events
    deleteAnnotation: AnnotationEvent<{}>
    setActiveAnnotation: AnnotationEvent<{}>
    setAnnotationShareInfo: AnnotationEvent<{
        keepListsIfUnsharing?: boolean
        privacyLevel: AnnotationPrivacyLevels
    }>
    updateListsForAnnotation: AnnotationEvent<{
        added: number | null
        deleted: number | null
        options?: { protectAnnotation?: boolean }
    }>

    // Selected space management
    setSelectedList: { unifiedListId: UnifiedList['unifiedId'] | null }

    goToAnnotationInNewTab: {
        context: AnnotationEventContext
        annotationUrl: string
    }
    setActiveAnnotationUrl: { annotationUrl: string }

    shareAnnotation: {
        context: AnnotationEventContext
        mouseEvent: React.MouseEvent
        annotationUrl: string
        followedListId?: string
    }
    switchAnnotationMode: {
        context: AnnotationEventContext
        annotationUrl: string
        mode: AnnotationMode
        followedListId?: string
    }

    // Misc events
    copyNoteLink: { link: string }
    copyPageLink: { link: string }

    setPageUrl: { pageUrl: string; rerenderHighlights?: boolean }

    // Search
    paginateSearch: null
    setPillVisibility: { value: string }
    setAnnotationsExpanded: { value: boolean }
    fetchSuggestedTags: null
    fetchSuggestedDomains: null

    // Followed lists (TODO: REMOVE)
    loadFollowedLists: null
    loadFollowedListNotes: { listId: string }
    expandFollowedListNotes: { listId: string }

    expandListAnnotations: { unifiedListId: UnifiedList['unifiedId'] }

    updateAnnotationShareInfo: {
        annotationUrl: string
        keepListsIfUnsharing?: boolean
        privacyLevel: AnnotationPrivacyLevels
    }
    updateAllAnnotationsShareInfo: AnnotationSharingStates

    setLoginModalShown: { shown: boolean }
    setDisplayNameSetupModalShown: { shown: boolean }
    setAnnotationShareModalShown: { shown: boolean }
    setBetaFeatureNotifModalShown: { shown: boolean }

    setPrivatizeNoteConfirmArgs: SidebarContainerState['confirmPrivatizeNoteArgs']
    setSelectNoteSpaceConfirmArgs: SidebarContainerState['confirmSelectNoteSpaceArgs']

    setAllNotesCopyPasterShown: { shown: boolean }
    setCopyPasterAnnotationId: { id: string; followedListId?: string }
    setTagPickerAnnotationId: { id: string }
    setListPickerAnnotationId: {
        id: string
        position: 'footer' | 'lists-bar'
        followedListId?: string
    }
    resetTagPickerAnnotationId: null
    resetCopyPasterAnnotationId: null
    resetListPickerAnnotationId: { id?: string }
    setAllNotesShareMenuShown: { shown: boolean }
    resetShareMenuNoteId: null
}

export type SidebarContainerEvents = UIEvent<
    AnnotationConversationEvent & SidebarEvents
>

export type AnnotationCardMode =
    | 'none'
    | 'copy-paster'
    | 'space-picker'
    | 'share-menu'
    | 'save-btn'
    | 'delete-confirm'
    | 'formatting-help'

export interface AnnotationCardInstance {
    unifiedAnnotationId: UnifiedAnnotation['unifiedId']
    isCommentTruncated: boolean
    isCommentEditing: boolean
    cardMode: AnnotationCardMode
    comment: string
}

export interface ListInstance {
    unifiedListId: UnifiedList['unifiedId']
    annotationRefsLoadState: TaskState
    annotationsLoadState: TaskState
    sharedAnnotationReferences?: SharedAnnotationReference[]
    isOpen: boolean
}
