import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'
import type {
    AnnotationConversationEvent,
    AnnotationConversationsState,
} from '@worldbrain/memex-common/lib/content-conversations/ui/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { AnnotationCardInstanceLocation, SidebarTheme } from '../types'
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
import type { ContentConversationsInterface } from 'src/content-conversations/background/types'
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
import type { SummarizationInterface } from 'src/summarization-llm/background/index'
import type { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import type { YoutubeService } from '@worldbrain/memex-common/lib/services/youtube'
import type { Storage, Runtime } from 'webextension-polyfill'

export interface SidebarContainerDependencies {
    elements?: {
        topBarLeft?: JSX.Element
    }
    fullPageUrl?: string
    pageTitle?: string
    searchResultLimit?: number
    showGoToAnnotationBtn?: boolean
    initialState?: 'visible' | 'hidden'
    sidebarContext: 'dashboard' | 'in-page' | 'pdf-viewer'
    onClickOutside?: React.MouseEventHandler
    showAnnotationShareModal?: () => void

    storageAPI: Storage.Static
    runtimeAPI: Runtime.Static
    shouldHydrateCacheOnInit?: boolean
    annotationsCache: PageAnnotationsCacheInterface

    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    summarizeBG: SummarizationInterface<'caller'>
    annotationsBG: AnnotationInterface<'caller'>
    customListsBG: RemoteCollectionsInterface
    contentSharingBG: ContentSharingInterface
    contentConversationsBG: ContentConversationsInterface
    syncSettingsBG: RemoteSyncSettingsInterface
    contentScriptsBG: ContentScriptsInterface<'caller'>
    authBG: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
    theme?: MemexTheme & Partial<SidebarTheme>

    currentUser?: UserReference
    // search: SearchInterface
    // bookmarks: BookmarksInterface
    analytics: Analytics
    copyPaster: RemoteCopyPasterInterface
    youtubePlayer?: YoutubePlayer
    youtubeService?: YoutubeService
    hasFeedActivity?: boolean
    clickFeedActivityIndicator?: () => void
    copyToClipboard: (text: string) => Promise<boolean>
}

export interface EditForm {
    isBookmarked: boolean
    commentText: string
    lists: number[]
}

export interface EditForms {
    [annotationUrl: string]: EditForm
}

export type SidebarTab = 'annotations' | 'spaces' | 'feed' | 'summary'

export interface SidebarContainerState extends AnnotationConversationsState {
    loadState: TaskState
    cacheLoadState: TaskState
    noteCreateState: TaskState
    secondarySearchState: TaskState
    remoteAnnotationsLoadState: TaskState
    foreignSelectedListLoadState: TaskState
    selectedTextAIPreview: string

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
    readingView?: boolean
    showAllNotesCopyPaster: boolean

    fullPageUrl?: string
    lists: PageAnnotationsCacheInterface['lists']
    annotations: PageAnnotationsCacheInterface['annotations']
    pageSummary: string
    prompt: string

    users: {
        [userId: string]: {
            name: string
            profileImgSrc?: string
        }
    }

    activeAnnotationId: UnifiedAnnotation['unifiedId'] | null

    listInstances: { [unifiedListId: UnifiedList['unifiedId']]: ListInstance }
    annotationCardInstances: { [instanceId: string]: AnnotationCardInstance }

    showCommentBox: boolean
    commentBox: EditForm

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
    pageHasNetworkAnnotations: boolean
    hasFeedActivity?: boolean
}

export type AnnotationEvent<T> = {
    unifiedAnnotationId: UnifiedAnnotation['unifiedId']
} & T

export type AnnotationCardInstanceEvent<T> = {
    instanceLocation: AnnotationCardInstanceLocation
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

    setActiveSidebarTab: {
        tab: SidebarTab
        textToProcess?: string
        url?: string
    }
    queryAIwithPrompt: {
        prompt: string
    }
    sortAnnotations: { sortingFn: AnnotationsSorter }
    receiveSharingAccessChange: {
        sharingAccess: AnnotationSharingAccess
    }
    setIsolatedViewOnSidebarLoad: null

    // New page note box
    setNewPageNoteText: { comment: string }
    saveNewPageNote: {
        shouldShare: boolean
        isProtected?: boolean
        annotationId?: string
        /** To be set if being called from a toggled list instance's create form. */
        listInstanceId?: UnifiedList['unifiedId']
        now?: number
    }
    cancelNewPageNote: null
    setNewPageNoteLists: { lists: number[] }

    // List instance events
    expandListAnnotations: { unifiedListId: UnifiedList['unifiedId'] }
    markFeedAsRead: null

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
    setActiveAnnotation: AnnotationEvent<{
        mode?: 'show' | 'edit' | 'edit_spaces'
    }>
    updateListsForAnnotation: AnnotationEvent<{
        added: number | null
        deleted: number | null
        options?: { protectAnnotation?: boolean }
    }>
    updateAnnotationShareInfo: AnnotationEvent<{
        keepListsIfUnsharing?: boolean
        privacyLevel: AnnotationPrivacyLevels
    }>
    updateAllAnnotationsShareInfo: AnnotationSharingStates

    // Selected space management
    setSelectedList: { unifiedListId: UnifiedList['unifiedId'] | null }
    setSelectedListFromWebUI: { sharedListId: string }

    goToAnnotationInNewTab: {
        unifiedAnnotationId: UnifiedAnnotation['unifiedId']
    }

    // Misc events
    copyNoteLink: { link: string }
    copyPageLink: { link: string }

    setPageUrl: {
        fullPageUrl: string
        skipListsLoad?: boolean
        rerenderHighlights?: boolean
    }

    // Search
    paginateSearch: null
    setPillVisibility: { value: string }
    setAnnotationsExpanded: { value: boolean }
    fetchSuggestedTags: null
    fetchSuggestedDomains: null

    setLoginModalShown: { shown: boolean }
    setDisplayNameSetupModalShown: { shown: boolean }
    setAnnotationShareModalShown: { shown: boolean }
    setBetaFeatureNotifModalShown: { shown: boolean }

    setPrivatizeNoteConfirmArgs: SidebarContainerState['confirmPrivatizeNoteArgs']
    setSelectNoteSpaceConfirmArgs: SidebarContainerState['confirmSelectNoteSpaceArgs']

    setAllNotesCopyPasterShown: { shown: boolean }
    setAllNotesShareMenuShown: { shown: boolean }
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
    conversationsLoadState: TaskState
    annotationsLoadState: TaskState
    sharedAnnotationReferences?: SharedAnnotationReference[]
    isOpen: boolean
}
