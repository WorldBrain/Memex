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

export interface CommonInteractionProps {
    onCopyPasterBtnClick: React.MouseEventHandler
    onTagPickerBtnClick: React.MouseEventHandler
    onBookmarkBtnClick: React.MouseEventHandler
    onShareBtnClick: React.MouseEventHandler
    onTrashBtnClick: React.MouseEventHandler
}

export type PageInteractionProps = Omit<
    CommonInteractionProps,
    'onReplyBtnClick' | 'onEditBtnClick' | 'onCommentChange'
> & {
    onListPickerBtnClick: React.MouseEventHandler
    onNotesBtnClick: React.MouseEventHandler
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
    hideShareMenu: () => void
    copySharedLink: (link: string) => Promise<void>
    updateShareInfo: (info: Partial<AnnotationSharingInfo>) => void
    onEditCancel: React.MouseEventHandler
    onEditConfirm: React.MouseEventHandler
    onEditBtnClick: React.MouseEventHandler
    onReplyBtnClick: React.MouseEventHandler
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

export interface NotePickerProps {
    onTagPickerUpdate: PickerUpdateHandler
}

// NOTE: Derived type - edit the original
export type NotePickerAugdProps = {
    [Key in keyof NotePickerProps]: (noteId: string) => NotePickerProps[Key]
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
}

export type PageData = Pick<
    PipelineRes,
    'fullUrl' | 'fullTitle' | 'tags' | 'favIconURI'
> & {
    normalizedUrl: string
    lists: string[]
    displayTime: number
    isBookmarked: boolean
}

export interface NoteResult {
    isEditing: boolean
    isBookmarked: boolean
    areRepliesShown: boolean
    isTagPickerShown: boolean
    isShareMenuShown: boolean
    isCopyPasterShown: boolean
    editNoteForm: NoteFormState
}

export interface PageResult {
    id: string
    notesType: NotesType
    areNotesShown: boolean
    isTagPickerShown: boolean
    isListPickerShown: boolean
    isCopyPasterShown: boolean
    loadNotesState: TaskState
    sortingFn: AnnotationsSorter
    newNoteForm: NoteFormState
    noteIds: { [key in NotesType]: string[] }
}

export interface PageResultsByDay {
    day: number
    pages: NormalizedState<PageResult>
}

export interface RootState {
    sharingAccess: AnnotationSharingAccess
    noteSharingInfo: { [noteId: string]: AnnotationSharingInfo }

    searchType: SearchType

    /** Holds page data specific to each page occurence on a specific day. */
    results: { [day: number]: PageResultsByDay }

    // Display data lookups
    /** Holds page data shared with all page occurences on any day. */
    pageData: NormalizedState<PageData>
    noteData: NormalizedState<NoteData & NoteResult>

    // Async operation states
    searchState: TaskState
    noteDeleteState: TaskState
    pageDeleteState: TaskState
    paginationState: TaskState
    noteUpdateState: TaskState
    newNoteCreateState: TaskState
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

    // Page data state mutations (*shared with all* occurences of the page in different days)
    setPageTags: { id: string; added?: string; deleted?: string }
    setPageLists: {
        id: string
        fullPageUrl: string
        added?: string
        deleted?: string
        skipPageIndexing?: boolean
    }
    setPageBookmark: { id: string; isBookmarked: boolean }
    confirmPageDelete: null
    cancelPageDelete: null

    // Page result state mutations (*specific to each* occurence of the page in different days)
    setPageCopyPasterShown: PageEventArgs & { isShown: boolean }
    setPageListPickerShown: PageEventArgs & { isShown: boolean }
    setPageTagPickerShown: PageEventArgs & { isShown: boolean }
    setPageNotesShown: PageEventArgs & { areShown: boolean }
    setPageNotesSort: PageEventArgs & { sortingFn: AnnotationsSorter }
    setPageNotesType: PageEventArgs & { noteType: NotesType }

    // New note form state mutations
    setPageNewNoteTagPickerShown: PageEventArgs & { isShown: boolean }
    setPageNewNoteCommentValue: PageEventArgs & { value: string }
    setPageNewNoteTags: PageEventArgs & { tags: string[] }
    cancelPageNewNote: PageEventArgs
    savePageNewNote: PageEventArgs & {
        fullPageUrl: string
        skipPageIndexing?: boolean
    }

    // Note result state mutations
    setNoteCopyPasterShown: NoteEventArgs & { isShown: boolean }
    setNoteTagPickerShown: NoteEventArgs & { isShown: boolean }
    setNoteRepliesShown: NoteEventArgs & { areShown: boolean }
    setNoteBookmark: NoteEventArgs & { isBookmarked: boolean }
    setNoteEditing: NoteEventArgs & { isEditing: boolean }
    setNoteTags: NoteEventArgs & { added?: string; deleted?: string }
    showNoteShareMenu: NoteEventArgs
    hideNoteShareMenu: NoteEventArgs
    copySharedNoteLink: NoteEventArgs & { link: string }
    updateNoteShareInfo: NoteEventArgs & {
        info: Partial<AnnotationSharingInfo>
    }
    confirmNoteDelete: null
    cancelNoteDelete: null

    // Note edit form state mutations
    setNoteEditCommentValue: NoteEventArgs & { value: string }
    cancelNoteEdit: NoteEventArgs
    saveNoteEdit: NoteEventArgs

    // Misc data setters
    setPageData: { pages: PageData[] }
    setPageSearchResult: { result: StandardSearchResponse }
    setAnnotationSearchResult: { result: AnnotationsSearchResponse }
}>
