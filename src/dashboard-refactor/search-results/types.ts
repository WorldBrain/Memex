import type { TaskState } from 'ui-logic-core/lib/types'
import type { UIEvent } from 'ui-logic-core'
import type { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import type { StandardSearchResponse } from 'src/search/background/types'
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
import type { RGBAColor } from 'src/annotations/cache/types'

export interface CommonInteractionProps {
    onCopyPasterBtnClick: React.MouseEventHandler
    onTagPickerBtnClick?: React.MouseEventHandler
    onListPickerBarBtnClick: React.MouseEventHandler
    onListPickerFooterBtnClick: React.MouseEventHandler
    onShareBtnClick: React.MouseEventHandler
    onTrashBtnClick: (instaDelete: boolean) => void
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
    onCopyPasterDefaultExecute: React.MouseEventHandler
    onPageDrag: React.DragEventHandler
    onPageDrop: React.DragEventHandler
    onMainContentHover: React.MouseEventHandler
    onFooterHover: React.MouseEventHandler
    onTagsHover: React.MouseEventHandler
    onListsHover: React.MouseEventHandler
    onUnhover: React.MouseEventHandler
    onClick: React.MouseEventHandler
    onMatchingTextToggleClick: React.MouseEventHandler
    onAIResultBtnClick: React.MouseEventHandler
    onEditTitleChange: (normalizedPageUrl, changedTitle) => void
    onEditTitleSave: (normalizedPageUrl, changedTitle) => void
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
    addNewSpaceViaWikiLinksEditNote: (spaceName: string) => void
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
    onEditHighlightBtnClick: React.MouseEventHandler
    onReplyBtnClick: React.MouseEventHandler
    onGoToHighlightClick: React.MouseEventHandler
    onCommentChange: (content: string) => void
    onBodyChange: (content: string) => void
    onCopyPasterDefaultExecute: () => void
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
}

// NOTE: Derived type - edit the original
export type PagePickerAugdProps = {
    [Key in keyof PagePickerProps]: (pageId: string) => PagePickerProps[Key]
}

export type SearchType =
    | 'pages'
    | 'notes'
    | 'videos'
    | 'twitter'
    | 'pdf'
    | 'events'
export type NotesType = 'search' | 'user' | 'followed'

export interface NoteFormState {
    isTagPickerShown: boolean
    isListPickerShown: boolean
    inputValue: string
    bodyInputValue: string
    tags: string[]
    lists: string[]
    isShown: boolean
}

export interface SelectableBlock {
    id: string
    type: 'page' | 'note'
    isInFocus?: boolean
    isActivated?: boolean
}

export interface NoteData {
    url: string
    pageUrl: string
    tags: string[]
    lists: string[]
    comment?: string
    highlight?: string
    isEdited?: boolean
    displayTime: number
    createdWhen?: Date
    selector?: Anchor
    isShared?: boolean
    isBulkShareProtected?: boolean
    color?: RGBAColor
    isInFocus?: boolean
}

export type PageData = Pick<
    PipelineRes,
    'fullUrl' | 'fullTitle' | 'favIconURI' | 'text'
> & {
    normalizedUrl: string
    lists: string[]
    displayTime: number
    totalAnnotationCount: number
    hasNotes: boolean
    type: 'pdf' | 'page'
    isShared?: boolean
    fullPdfUrl?: string
    uploadedPdfLinkLoadState?: TaskState
    editTitleState?: string
    text?: string
    isInFocus?: boolean
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

export type ListPickerShowState = 'footer' | 'lists-bar' | 'hide'
export interface NoteResult {
    isEditing: boolean
    isBodyEditing: boolean
    areRepliesShown: boolean
    isTagPickerShown: boolean
    isCopyPasterShown: boolean
    copyLoadingState: TaskState
    listPickerShowStatus: ListPickerShowState
    shareMenuShowStatus: 'show' | 'hide' | 'show-n-share'
    editNoteForm: NoteFormState
}

export interface PageResult {
    pageId: string
    notesType: NotesType
    areNotesShown: boolean
    activePage: boolean
    isShareMenuShown: boolean
    isTagPickerShown: boolean
    isCopyPasterShown: boolean
    copyLoadingState: TaskState
    listPickerShowStatus: ListPickerShowState
    loadNotesState: TaskState
    newNoteForm: NoteFormState
    noteIds: { [key in NotesType]: string[] }
    hoverState: ResultHoverState
    editTitleState?: string
    showAllResults?: boolean
}

export interface PageResultsByDay {
    day: number
    pages: NormalizedState<PageResult>
}

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
    isSubscriptionBannerShown: boolean

    // TODO: This needs to be reset every single time the search filters change - simply used for pagination in blank search
    blankSearchOldestResultTimestamp: number | null

    /** Holds page data specific to each page occurrence on a specific day. */
    results: NestedResults
    areResultsExhausted: boolean

    pageIdToResultIds: { [pageId: string]: string[] }

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
    uploadedPdfLinkLoadState: TaskState
    newNoteCreateState: TaskState
    clearInboxLoadState: TaskState
    searchPaginationState: TaskState

    // Misc local storage flags
    showMobileAppAd: boolean
    showOnboardingMsg: boolean
    activePageID: string
    activeDay: number
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
    /** NOTE: Does not mutate state */
    copyShareLink: {
        link: string
        analyticsAction: AnalyticsEvents['ContentSharing']
    }

    dismissMobileAd: null
    dismissOnboardingMsg: null
    dismissSubscriptionBanner: null

    // Page data state mutations (*shared with all* occurences of the page in different days)
    setPageLists: {
        pageResultId: string
        added?: string
        deleted?: string
        skipPageIndexing?: boolean
    }
    confirmPageDelete: null
    cancelPageDelete: null

    bulkDeleteItem: { pageId: string }
    // Page result state mutations (*specific to each* occurrence of the page in different days)
    clickPageResult: PageEventArgs & { synthEvent: React.MouseEvent }
    setPageCopyPasterShown: PageEventArgs & {
        isShown: boolean
        event: React.MouseEvent
    }
    setCopyPasterDefaultExecute: PageEventArgs & {
        isShown: boolean
        event: React.MouseEvent
    }
    setCopyPasterDefaultNoteExecute: NoteEventArgs
    setPageListPickerShown: PageEventArgs & { show: ListPickerShowState }
    setPageTagPickerShown: PageEventArgs & { isShown: boolean }
    setPageShareMenuShown: PageEventArgs & { isShown: boolean }
    setPageNotesShown: PageEventArgs & { areShown: boolean }
    onMatchingTextToggleClick: PageEventArgs
    setActivePage: {
        activePage: boolean
        activeDay?: number
        activePageID?: string
    }
    setPageNotesSort: PageEventArgs & { sortingFn: AnnotationsSorter }
    setPageNotesType: PageEventArgs & { noteType: NotesType }
    setPageHover: PageEventArgs & { hover: ResultHoverState }
    removePageFromList: PageEventArgs
    clearInbox: null
    bulkSelectItems: {
        item: {
            title: string
            url: string
            type: 'page' | 'note'
        }
        remove?: boolean
    }
    dragPage: PageEventArgs & { dataTransfer: DataTransfer }
    dropPage: PageEventArgs
    updatePageNotesShareInfo: PageEventArgs & {
        shareStates: AnnotationSharingStates
    }
    updateAllPageResultNotesShareInfo: { shareStates: AnnotationSharingStates }

    // New note form state mutations
    setPageNewNoteTagPickerShown: PageEventArgs & { isShown: boolean }
    setPageNewNoteCommentValue: PageEventArgs & { value: string }
    setPageNewNoteLists: PageEventArgs & { lists: string[] }
    cancelPageNewNote: PageEventArgs
    savePageNewNote: PageEventArgs & {
        fullPageUrl: string
        shouldShare: boolean
        isProtected?: boolean
    }

    updateSpacesSearchSuggestions: {
        searchQuery: string
    }
    addNewSpaceViaWikiLinksNewNote: {
        spaceName: string
        day: number
        pageId: string
    }

    // Note result state mutations
    setNoteCopyPasterShown: NoteEventArgs & { isShown: boolean }
    setNoteTagPickerShown: NoteEventArgs & { isShown: boolean }
    setNoteListPickerShown: NoteEventArgs & { show: ListPickerShowState }
    setNoteShareMenuShown: NoteEventArgs & {
        shouldShow: boolean
        mouseEvent: React.MouseEvent
        platform: string
    }
    setNoteRepliesShown: NoteEventArgs & { areShown: boolean }
    setNoteEditing: NoteEventArgs & { isEditing: boolean }
    setBodyEditing: NoteEventArgs & { isEditing: boolean }
    setNoteTags: NoteEventArgs & { added?: string; deleted?: string }
    setNoteLists: NoteEventArgs & {
        added?: string
        deleted?: string
        protectAnnotation?: boolean
    }
    updateNoteShareInfo: NoteEventArgs & {
        privacyLevel: AnnotationPrivacyLevels
        keepListsIfUnsharing?: boolean
    }
    goToHighlightInNewTab: NoteEventArgs
    confirmNoteDelete: null
    cancelNoteDelete: null
    toggleNoteSidebarOn: null
    toggleNoteSidebarOff: null

    // Note edit form state mutations
    setNoteEditCommentValue: NoteEventArgs & { value: string }
    setNoteEditBodyValue: NoteEventArgs & { value: string }
    cancelNoteEdit: NoteEventArgs
    saveNoteEdit: NoteEventArgs & {
        shouldShare: boolean
        isProtected?: boolean
        mainBtnPressed?: boolean
        keepListsIfUnsharing?: boolean
        color?: RGBAColor | string
    }
}>
