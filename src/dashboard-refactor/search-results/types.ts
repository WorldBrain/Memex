import type { TaskState } from 'ui-logic-core/lib/types'
import type { UIEvent } from 'ui-logic-core'

import type { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import type {
    AnnotationsSearchResponse,
    StandardSearchResponse,
} from 'src/search/background/types'
import type { PipelineRes } from 'src/search'
import type { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import type { Anchor } from 'src/highlighting/types'
import type { AnalyticsEvents } from 'src/analytics/types'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type {
    AnnotationSharingState,
    AnnotationSharingStates,
} from 'src/content-sharing/background/types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

export interface CommonInteractionProps {
    onCopyPasterBtnClick: React.MouseEventHandler
    onTagPickerBtnClick?: React.MouseEventHandler
    onListPickerBtnClick: React.MouseEventHandler
    onShareBtnClick: React.MouseEventHandler
    onTrashBtnClick: React.MouseEventHandler
    createNewList: (name: string) => Promise<number>
}

export type PageInteractionProps = Omit<
    CommonInteractionProps,
    'onReplyBtnClick' | 'onEditBtnClick' | 'onCommentChange'
> & {
    updatePageNotesShareInfo: (shareStates: AnnotationSharingStates) => void
    // TODO: Remove before merging to develop. Commented just in case we need to go back
    // updatePageNotesShareInfo: (info: NoteShareInfo) => void
    onRemoveFromListBtnClick: React.MouseEventHandler
    onNotesBtnClick: React.MouseEventHandler
    onPageDrag: React.DragEventHandler
    onPageDrop: React.DragEventHandler
    onMainContentHover: React.MouseEventHandler
    onFooterHover: React.MouseEventHandler
    onTagsHover: React.MouseEventHandler
    onListsHover: React.MouseEventHandler
    onUnhover: React.MouseEventHandler
}

// NOTE: Derived type - edit the original
export type PageInteractionAugdProps = {
    [Key in keyof PageInteractionProps]: (
        day: number,
        pageId: string,
    ) => PageInteractionProps[Key]
}

export type NoteInteractionProps = Omit<
    CommonInteractionProps,
    'onNotesBtnClick'
> & {
    updateShareInfo: (
        info: AnnotationSharingState,
        opts?: { keepListsIfUnsharing?: boolean },
    ) => void
    updateTags: PickerUpdateHandler<string>
    updateLists: PickerUpdateHandler<number>
    onEditCancel: React.MouseEventHandler
    onEditConfirm: (
        showExternalConfirmations?: boolean,
    ) => (
        shouldShare: boolean,
        isProtected: boolean,
        opts?: {
            mainBtnPressed?: boolean
            keepListsIfUnsharing?: boolean
        },
    ) => void
    onEditBtnClick: React.MouseEventHandler
    onReplyBtnClick: React.MouseEventHandler
    onGoToHighlightClick: React.MouseEventHandler
    onCommentChange: React.KeyboardEventHandler<HTMLTextAreaElement>
}

// NOTE: Derived type - edit the original
export type NoteInteractionAugdProps = {
    [Key in keyof NoteInteractionProps]: (
        noteId: string,
        day: number,
        pageId: string,
    ) => NoteInteractionProps[Key]
}

export interface PagePickerProps {
    onListPickerUpdate: PickerUpdateHandler<number>
    onTagPickerUpdate: PickerUpdateHandler<string>
}

// NOTE: Derived type - edit the original
export type PagePickerAugdProps = {
    [Key in keyof PagePickerProps]: (pageId: string) => PagePickerProps[Key]
}

export type SearchResultToState = (
    result: AnnotationsSearchResponse | StandardSearchResponse,
    extraPageResultState?: Pick<PageResult, 'areNotesShown'>,
) => Pick<RootState, 'results' | 'noteData' | 'pageData'>

export type SearchType = 'pages' | 'notes'
export type NotesType = 'search' | 'user' | 'followed'

export interface NoteFormState {
    isTagPickerShown: boolean
    isListPickerShown: boolean
    inputValue: string
    tags: string[]
    lists: number[]
}

export interface NoteData {
    url: string
    pageUrl: string
    tags: string[]
    lists: number[]
    comment?: string
    highlight?: string
    isEdited?: boolean
    displayTime: number
    createdWhen?: Date
    selector?: Anchor
    isShared?: boolean
    isBulkShareProtected?: boolean
}

export type PageData = Pick<
    PipelineRes,
    'fullUrl' | 'fullTitle' | 'tags' | 'favIconURI'
> & {
    normalizedUrl: string
    lists: number[]
    displayTime: number
    hasNotes: boolean
    type: 'pdf' | 'page'
    isShared?: boolean
    pdfUrl?: string
    fullPdfUrl?: string
}

export type NoResultsType =
    | 'onboarding-msg'
    | 'mobile-list'
    | 'mobile-list-ad'
    | 'stop-words'
    | 'no-results'
    | null
export type ResultHoverState =
    | 'main-content'
    | 'footer'
    | 'tags'
    | 'lists'
    | null
export interface NoteShareInfo {
    isShared: boolean
    isProtected?: boolean
}

export interface NoteResult {
    isEditing: boolean
    areRepliesShown: boolean
    isTagPickerShown: boolean
    isListPickerShown: boolean
    shareMenuShowStatus: 'show' | 'hide' | 'show-n-share'
    isCopyPasterShown: boolean
    editNoteForm: NoteFormState
}

export interface PageResult {
    id: string
    notesType: NotesType
    areNotesShown: boolean
    isShareMenuShown: boolean
    isTagPickerShown: boolean
    isListPickerShown: boolean
    isCopyPasterShown: boolean
    loadNotesState: TaskState
    newNoteForm: NoteFormState
    noteIds: { [key in NotesType]: string[] }
    hoverState: ResultHoverState
}

export interface PageResultsByDay {
    day: number
    pages: NormalizedState<PageResult>
}

// tslint:disable-next-line
export type NestedResults = {
    [day: number]: PageResultsByDay
}

export interface RootState {
    searchType: SearchType
    draggedPageId?: string
    noResultsType: NoResultsType
    isListShareMenuShown: boolean
    isSortMenuShown: boolean
    shouldShowTagsUIs: boolean
    shouldFormsAutoFocus: boolean
    isSearchCopyPasterShown: boolean
    isCloudUpgradeBannerShown: boolean
    isSubscriptionBannerShown: boolean

    /** Holds page data specific to each page occurrence on a specific day. */
    results: NestedResults
    areResultsExhausted: boolean

    // Display data lookups
    /** Holds page data shared with all page occurrences on any day. */
    pageData: NormalizedState<PageData>
    noteData: NormalizedState<NoteData & NoteResult>

    // Async operation states
    searchState: TaskState
    noteDeleteState: TaskState
    pageDeleteState: TaskState
    paginationState: TaskState
    noteUpdateState: TaskState
    newNoteCreateState: TaskState
    searchPaginationState: TaskState

    // Misc local storage flags
    showMobileAppAd: boolean
    showOnboardingMsg: boolean
}

export interface PageEventArgs {
    pageId: string
    day: number
}

export interface NoteEventArgs {
    noteId: string
}

// Needs day, page ID, and note ID to access correct note in nested search results states
export type NoteDataEventArgs = NoteEventArgs & PageEventArgs

export type Events = UIEvent<{
    // Root state mutations
    setSearchType: { searchType: SearchType }
    setAllNotesShown: { areShown: boolean }
    setListShareMenuShown: { isShown: boolean }
    setSortMenuShown: { isShown: boolean }
    setSearchCopyPasterShown: { isShown: boolean }
    setPageData: { pages: PageData[] }
    setPageSearchResult: { result: StandardSearchResponse }
    setAnnotationSearchResult: { result: AnnotationsSearchResponse }
    /** NOTE: Does not mutate state */
    copyShareLink: {
        link: string
        analyticsAction: AnalyticsEvents['ContentSharing']
    }

    dismissMobileAd: null
    dismissOnboardingMsg: null
    dismissSubscriptionBanner: null

    // Page data state mutations (*shared with all* occurences of the page in different days)
    setPageTags: {
        id: string
        fullPageUrl: string
        added?: string
        deleted?: string
    }
    setPageLists: {
        id: string
        fullPageUrl: string
        added?: number
        deleted?: number
        skipPageIndexing?: boolean
    }
    confirmPageDelete: null
    cancelPageDelete: null

    // Page result state mutations (*specific to each* occurrence of the page in different days)
    setPageCopyPasterShown: PageEventArgs & { isShown: boolean }
    setPageListPickerShown: PageEventArgs & { isShown: boolean }
    setPageTagPickerShown: PageEventArgs & { isShown: boolean }
    setPageShareMenuShown: PageEventArgs & { isShown: boolean }
    setPageNotesShown: PageEventArgs & { areShown: boolean }
    setPageNotesSort: PageEventArgs & { sortingFn: AnnotationsSorter }
    setPageNotesType: PageEventArgs & { noteType: NotesType }
    setPageHover: PageEventArgs & { hover: ResultHoverState }
    removePageFromList: PageEventArgs
    dragPage: PageEventArgs & { dataTransfer: DataTransfer }
    dropPage: PageEventArgs
    updatePageNotesShareInfo: PageEventArgs & {
        shareStates: AnnotationSharingStates
    }
    updateAllPageResultNotesShareInfo: { shareStates: AnnotationSharingStates }

    // New note form state mutations
    setPageNewNoteTagPickerShown: PageEventArgs & { isShown: boolean }
    setPageNewNoteCommentValue: PageEventArgs & { value: string }
    setPageNewNoteTags: PageEventArgs & { tags: string[] }
    setPageNewNoteLists: PageEventArgs & { lists: number[] }
    cancelPageNewNote: PageEventArgs
    savePageNewNote: PageEventArgs & {
        fullPageUrl: string
        shouldShare: boolean
        isProtected?: boolean
    }

    // Note result state mutations
    setNoteCopyPasterShown: NoteEventArgs & { isShown: boolean }
    setNoteTagPickerShown: NoteEventArgs & { isShown: boolean }
    setNoteListPickerShown: NoteEventArgs & { isShown: boolean }
    setNoteShareMenuShown: NoteEventArgs & {
        shouldShow: boolean
        mouseEvent: React.MouseEvent
        platform: string
    }
    setNoteRepliesShown: NoteEventArgs & { areShown: boolean }
    setNoteEditing: NoteEventArgs & { isEditing: boolean }
    setNoteTags: NoteEventArgs & { added?: string; deleted?: string }
    setNoteLists: NoteEventArgs & {
        added?: number
        deleted?: number
        protectAnnotation?: boolean
    }
    updateNoteShareInfo: NoteEventArgs & {
        privacyLevel: AnnotationPrivacyLevels
        keepListsIfUnsharing?: boolean
    }
    goToHighlightInNewTab: NoteEventArgs
    confirmNoteDelete: null
    cancelNoteDelete: null

    // Note edit form state mutations
    setNoteEditCommentValue: NoteEventArgs & { value: string }
    cancelNoteEdit: NoteEventArgs
    saveNoteEdit: NoteEventArgs & {
        shouldShare: boolean
        isProtected?: boolean
        mainBtnPressed?: boolean
        keepListsIfUnsharing?: boolean
    }
}>
