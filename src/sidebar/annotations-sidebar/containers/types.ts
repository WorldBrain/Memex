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
import type { AnnotationsCacheInterface } from 'src/annotations/annotations-cache'
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

export interface SidebarContainerDependencies {
    elements?: {
        topBarLeft?: JSX.Element
    }
    pageUrl?: string
    getPageUrl: () => MaybePromise<string>
    pageTitle?: string
    searchResultLimit?: number
    showGoToAnnotationBtn?: boolean
    initialState?: 'visible' | 'hidden'
    onClickOutside?: React.MouseEventHandler
    annotationsCache: AnnotationsCacheInterface
    showAnnotationShareModal?: () => void
    sidebarContext: 'dashboard' | 'in-page' | 'pdf-viewer'

    tags: RemoteTagsInterface
    annotations: AnnotationInterface<'caller'>
    customLists: RemoteCollectionsInterface
    contentSharing: ContentSharingInterface
    contentConversationsBG: ContentConversationsInterface
    syncSettingsBG: RemoteSyncSettingsInterface
    auth: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
    theme?: MemexTheme & Partial<SidebarTheme>
    // search: SearchInterface
    // bookmarks: BookmarksInterface
    analytics: Analytics
    copyToClipboard: (text: string) => Promise<boolean>
    copyPaster: RemoteCopyPasterInterface
    contentScriptBackground: ContentScriptsInterface<'caller'>
}

export interface EditForm {
    isBookmarked: boolean
    isTagInputActive: boolean
    commentText: string
    tags: string[]
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

export type FollowedListState = SharedAnnotationList & {
    isExpanded: boolean
    isContributable: boolean
    annotationEditForms: EditForms
    annotationsLoadState: TaskState
    conversationsLoadState: TaskState
    activeShareMenuAnnotationId: string | undefined
    activeCopyPasterAnnotationId: string | undefined
    activeListPickerAnnotationId: string | undefined
    annotationModes: { [annotationId: string]: AnnotationMode }
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
    isExpanded: boolean
    isExpandedSharedSpaces: boolean
    sidebarWidth: string
    isolatedView?: string | null // if null show default view

    annotationSharingAccess: AnnotationSharingAccess

    showAllNotesCopyPaster: boolean
    activeCopyPasterAnnotationId: string | undefined
    activeListPickerAnnotationId: string | undefined
    activeTagPickerAnnotationId: string | undefined

    pageUrl?: string
    annotations: Annotation[]
    annotationModes: {
        [context in AnnotationEventContext]: {
            [annotationUrl: string]: AnnotationMode
        }
    }
    activeAnnotationUrl: string | null

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

    confirmPrivatizeNoteArgs: null | SidebarEvents['editAnnotation']
    confirmSelectNoteSpaceArgs: null | SidebarEvents['updateListsForAnnotation']

    showAllNotesShareMenu: boolean
    activeShareMenuNoteId: string | undefined
    immediatelyShareNotes: boolean
}

interface SidebarEvents {
    show: null
    hide: null
    lock: null
    unlock: null
    lockWidth: null
    unlockWidth: null

    sortAnnotations: { sortingFn: AnnotationsSorter }

    expandMyNotes: null
    expandSharedSpaces: { listIds: string[] }

    // Adding a new page comment
    addNewPageComment: { comment?: string; tags?: string[] }
    changeNewPageCommentText: { comment: string }
    cancelEdit: { annotationUrl: string }
    changeEditCommentText: { annotationUrl: string; comment: string }
    saveNewPageComment: { shouldShare: boolean; isProtected?: boolean }
    cancelNewPageComment: null
    updateNewPageCommentTags: { tags: string[] }
    updateNewPageCommentLists: { lists: number[] }

    setEditCommentTagPicker: { annotationUrl: string; active: boolean }

    updateTagsForEdit: {
        added?: string
        deleted?: string
        annotationUrl: string
    }
    updateListsForAnnotation: {
        added: number | null
        deleted: number | null
        annotationId: string
        options?: { protectAnnotation?: boolean }
    }
    deleteEditCommentTag: { tag: string; annotationUrl: string }

    receiveSharingAccessChange: {
        sharingAccess: AnnotationSharingAccess
    }

    // Annotation boxes
    goToAnnotationInNewTab: {
        context: AnnotationEventContext
        annotationUrl: string
    }
    setActiveAnnotationUrl: { annotationUrl: string }
    setAnnotationEditMode: {
        context: AnnotationEventContext
        annotationUrl: string
        followedListId?: string
    }
    editAnnotation: {
        context: AnnotationEventContext
        annotationUrl: string
        shouldShare: boolean
        isProtected?: boolean
        mainBtnPressed?: boolean
        keepListsIfUnsharing?: boolean
    }
    deleteAnnotation: {
        context: AnnotationEventContext
        annotationUrl: string
    }
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

    copyNoteLink: { link: string }
    copyPageLink: { link: string }

    setPageUrl: { pageUrl: string; rerenderHighlights?: boolean }

    // Search
    paginateSearch: null
    setAnnotationsExpanded: { value: boolean }
    fetchSuggestedTags: null
    fetchSuggestedDomains: null

    // Followed lists
    loadFollowedLists: null
    loadFollowedListNotes: { listId: string }
    expandFollowedListNotes: { listId: string }
    toggleIsolatedListView: { listId: string }

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
    setListPickerAnnotationId: { id: string; followedListId?: string }
    resetTagPickerAnnotationId: null
    resetCopyPasterAnnotationId: null
    resetListPickerAnnotationId: { id?: string }
    setAllNotesShareMenuShown: { shown: boolean }
    resetShareMenuNoteId: null
}

export type SidebarContainerEvents = UIEvent<
    AnnotationConversationEvent & SidebarEvents
>
