import { UIEvent } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'
import {
    AnnotationConversationEvent,
    AnnotationConversationsState,
} from '@worldbrain/memex-common/lib/content-conversations/ui/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import {
    RemoteCollectionsInterface,
    SharedAnnotationList,
} from 'src/custom-lists/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { AnnotationsCacheInterface } from 'src/annotations/annotations-cache'
import { SidebarTheme } from '../types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { Analytics } from 'src/analytics'
import { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import type {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import type { AnnotationsSorter } from '../sorting'
import type { Annotation, AnnotationPrivacyLevels } from 'src/annotations/types'
import type { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import type { Anchor } from 'src/highlighting/types'
import type { NormalizedState } from 'src/common-ui/types'
import type { ContentConversationsInterface } from 'src/content-conversations/background/types'

export interface SidebarContainerDependencies {
    elements?: {
        topBarLeft?: JSX.Element
    }
    pageUrl?: string
    getPageUrl: () => string
    pageTitle?: string
    searchResultLimit?: number
    showGoToAnnotationBtn?: boolean
    initialState?: 'visible' | 'hidden'
    onClickOutside?: React.MouseEventHandler
    annotationsCache: AnnotationsCacheInterface
    showLoginModal?: () => void
    showAnnotationShareModal?: () => void
    showBetaFeatureNotifModal?: () => void

    tags: RemoteTagsInterface
    annotations: AnnotationInterface<'caller'>
    customLists: RemoteCollectionsInterface
    contentSharing: ContentSharingInterface
    contentConversationsBG: ContentConversationsInterface
    auth: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
    theme?: Partial<SidebarTheme>
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
}

export interface EditForms {
    [annotationUrl: string]: EditForm
}

export type AnnotationEventContext = 'pageAnnotations' | 'searchResults'
export type SearchType = 'notes' | 'page' | 'social'
export type PageType = 'page' | 'all'
export type SidebarDisplayMode = 'private-notes' | 'shared-notes'
export interface SearchTypeChange {
    searchType?: 'notes' | 'page' | 'social'
    resultsSearchType?: 'notes' | 'page' | 'social'
    pageType?: 'page' | 'all'
}

export interface FollowedListAnnotation {
    id: string
    body?: string
    comment?: string
    selector?: Anchor
    createdWhen: number
    updatedWhen?: number
    creatorId: string
}

interface SidebarFollowedListsState {
    followedListLoadState: TaskState
    followedLists: NormalizedState<
        SharedAnnotationList & {
            isExpanded: boolean
            annotationsLoadState: TaskState
            conversationsLoadState: TaskState
        }
    >

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
    primarySearchState: TaskState
    secondarySearchState: TaskState

    showState: 'visible' | 'hidden'
    displayMode: SidebarDisplayMode
    isLocked: boolean

    annotationSharingAccess: AnnotationSharingAccess
    annotationSharingInfo: {
        [annotationUrl: string]: AnnotationSharingInfo
    }

    showAllNotesCopyPaster: boolean
    activeCopyPasterAnnotationId: string | undefined
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

    annotCount?: number

    // Search result props
    shouldShowCount: boolean
    isInvalidSearch: boolean
    totalResultCount: number
    searchResultSkip: number

    isListFilterActive: boolean
    showLoginModal: boolean
    showAnnotationsShareModal: boolean
    showBetaFeatureNotifModal: boolean

    showAllNotesShareMenu: boolean
    activeShareMenuNoteId: string | undefined
    immediatelyShareNotes: boolean
}

export type SidebarContainerEvents = UIEvent<
    AnnotationConversationEvent & {
        show: null
        hide: null
        lock: null
        unlock: null

        sortAnnotations: { sortingFn: AnnotationsSorter }

        setDisplayMode: { mode: SidebarDisplayMode }

        // Adding a new page comment
        addNewPageComment: { comment?: string; tags?: string[] }
        changeNewPageCommentText: { comment: string }
        cancelEdit: { annotationUrl: string }
        changeEditCommentText: { annotationUrl: string; comment: string }
        saveNewPageComment: { privacyLevel: AnnotationPrivacyLevels }
        cancelNewPageComment: null
        updateNewPageCommentTags: { tags: string[] }

        setEditCommentTagPicker: { annotationUrl: string; active: boolean }

        updateTagsForEdit: {
            added?: string
            deleted?: string
            annotationUrl: string
        }
        updateListsForPageResult: {
            added?: string
            deleted?: string
            url: string
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
        }
        editAnnotation: {
            context: AnnotationEventContext
            annotationUrl: string
        }
        deleteAnnotation: {
            context: AnnotationEventContext
            annotationUrl: string
        }
        shareAnnotation: {
            context: AnnotationEventContext
            annotationUrl: string
            mouseEvent: React.MouseEvent
        }
        switchAnnotationMode: {
            context: AnnotationEventContext
            annotationUrl: string
            mode: AnnotationMode
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

        updateAnnotationShareInfo: {
            annotationUrl: string
            info: Partial<AnnotationSharingInfo>
        }
        updateAllAnnotationsShareInfo: {
            info: AnnotationSharingInfo
        }

        setLoginModalShown: { shown: boolean }
        setAnnotationShareModalShown: { shown: boolean }
        setBetaFeatureNotifModalShown: { shown: boolean }

        setAllNotesCopyPasterShown: { shown: boolean }
        setCopyPasterAnnotationId: { id: string }
        setTagPickerAnnotationId: { id: string }
        resetTagPickerAnnotationId: null
        resetCopyPasterAnnotationId: null

        setAllNotesShareMenuShown: { shown: boolean }
        resetShareMenuNoteId: null
    }
>
