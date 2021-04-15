import { TaskState } from 'ui-logic-core/lib/types'
import { UIEvent } from 'ui-logic-core'

import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    AnnotationsSearchResponse,
    StandardSearchResponse,
} from 'src/search/background/types'
import { PipelineRes } from 'src/search'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import { Anchor } from 'src/highlighting/types'
import { AnnotationPrivacyLevels } from 'src/annotations/types'

export interface CommonInteractionProps {
    onCopyPasterBtnClick: React.MouseEventHandler
    onTagPickerBtnClick: React.MouseEventHandler
    onShareBtnClick: React.MouseEventHandler
    onTrashBtnClick: React.MouseEventHandler
    onMainContentHover: React.MouseEventHandler
    onFooterHover: React.MouseEventHandler
    onTagsHover: React.MouseEventHandler
    onUnhover: React.MouseEventHandler
}

export type PageInteractionProps = Omit<
    CommonInteractionProps,
    'onReplyBtnClick' | 'onEditBtnClick' | 'onCommentChange'
> & {
    updatePageNotesShareInfo: (info: Partial<AnnotationSharingInfo>) => void
    onRemoveFromListBtnClick: React.MouseEventHandler
    onListPickerBtnClick: React.MouseEventHandler
    onNotesBtnClick: React.MouseEventHandler
    onPageDrag: React.DragEventHandler
    onPageDrop: React.DragEventHandler
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
    'onNotesBtnClick' | 'onListPickerBtnClick'
> & {
    updateShareInfo: (info: Partial<AnnotationSharingInfo>) => void
    updateTags: PickerUpdateHandler
    onNoteHover: React.MouseEventHandler
    onEditCancel: React.MouseEventHandler
    onEditConfirm: React.MouseEventHandler
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
    onListPickerUpdate: PickerUpdateHandler
    onTagPickerUpdate: PickerUpdateHandler
}

// NOTE: Derived type - edit the original
export type PagePickerAugdProps = {
    [Key in keyof PagePickerProps]: (pageId: string) => PagePickerProps[Key]
}

export type SearchResultToState = (
    result: AnnotationsSearchResponse | StandardSearchResponse,
) => Pick<RootState, 'results' | 'noteData' | 'pageData'>

export type SearchType = 'pages' | 'notes'
export type NotesType = 'search' | 'user' | 'followed'

export interface NormalizedState<T> {
    allIds: string[]
    byId: { [id: string]: T }
}

export interface NoteFormState {
    isTagPickerShown: boolean
    inputValue: string
    tags: string[]
}

export interface NoteData {
    url: string
    pageUrl: string
    tags: string[]
    comment?: string
    highlight?: string
    isEdited?: boolean
    displayTime: number
    createdWhen?: Date
    selector?: Anchor
    privacyLevel: AnnotationPrivacyLevels
}

export type PageData = Pick<
    PipelineRes,
    'fullUrl' | 'fullTitle' | 'tags' | 'favIconURI'
> & {
    normalizedUrl: string
    lists: string[]
    displayTime: number
    hasNotes: boolean
    isShared?: boolean
}

export type NoResultsType =
    | 'onboarding-msg'
    | 'mobile-list'
    | 'mobile-list-ad'
    | 'stop-words'
    | 'no-results'
    | null
export type ResultHoverState = 'main-content' | 'footer' | 'tags' | null
export type NoteResultHoverState = ResultHoverState | 'note'

export interface NoteResult {
    isEditing: boolean
    areRepliesShown: boolean
    isTagPickerShown: boolean
    shareMenuShowStatus: 'show' | 'hide' | 'show-n-share'
    isCopyPasterShown: boolean
    editNoteForm: NoteFormState
    hoverState: NoteResultHoverState
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
    sharingAccess: AnnotationSharingAccess
    noteSharingInfo: { [noteId: string]: AnnotationSharingInfo }

    searchType: SearchType
    draggedPageId?: string
    noResultsType: NoResultsType
    shouldFormsAutoFocus: boolean
    isSearchCopyPasterShown: boolean

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
    setSearchCopyPasterShown: { isShown: boolean }
    setPageData: { pages: PageData[] }
    setPageSearchResult: { result: StandardSearchResponse }
    setAnnotationSearchResult: { result: AnnotationsSearchResponse }
    /** NOTE: Does not mutate state */
    copyShareLink: {
        link: string
        analyticsAction: 'copyNoteLink' | 'copyPageLink'
    }
    dismissMobileAd: null
    dismissOnboardingMsg: null

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
        added?: string
        deleted?: string
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
        info: Partial<AnnotationSharingInfo>
    }

    // New note form state mutations
    setPageNewNoteTagPickerShown: PageEventArgs & { isShown: boolean }
    setPageNewNoteCommentValue: PageEventArgs & { value: string }
    setPageNewNoteTags: PageEventArgs & { tags: string[] }
    cancelPageNewNote: PageEventArgs
    savePageNewNote: PageEventArgs & {
        fullPageUrl: string
        privacyLevel: AnnotationPrivacyLevels
    }

    // Note result state mutations
    setNoteCopyPasterShown: NoteEventArgs & { isShown: boolean }
    setNoteTagPickerShown: NoteEventArgs & { isShown: boolean }
    setNoteShareMenuShown: NoteEventArgs & {
        shouldShow: boolean
        mouseEvent: React.MouseEvent
    }
    setNoteRepliesShown: NoteEventArgs & { areShown: boolean }
    setNoteHover: NoteEventArgs & { hover: NoteResultHoverState }
    setNoteEditing: NoteEventArgs & { isEditing: boolean }
    setNoteTags: NoteEventArgs & { added?: string; deleted?: string }
    updateNoteShareInfo: NoteEventArgs & {
        info: Partial<AnnotationSharingInfo>
    }
    /** NOTE: Does not mutate state */
    goToHighlightInNewTab: NoteEventArgs
    confirmNoteDelete: null
    cancelNoteDelete: null

    // Note edit form state mutations
    setNoteEditCommentValue: NoteEventArgs & { value: string }
    cancelNoteEdit: NoteEventArgs
    saveNoteEdit: NoteEventArgs
}>
