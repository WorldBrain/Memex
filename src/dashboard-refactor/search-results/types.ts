import { TaskState } from 'ui-logic-core/lib/types'
import { UIEvent } from 'ui-logic-core'

import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    AnnotationsSearchResponse,
    StandardSearchResponse,
} from 'src/search/background/types'
import { PipelineRes } from 'src/search'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'

export interface InteractionProps {
    onCopyPasterBtnClick: React.MouseEventHandler
    onListPickerBtnClick: React.MouseEventHandler
    onTagPickerBtnClick: React.MouseEventHandler
    onBookmarkBtnClick: React.MouseEventHandler
    onNotesBtnClick: React.MouseEventHandler
    onReplyBtnClick: React.MouseEventHandler
    onShareBtnClick: React.MouseEventHandler
    onTrashBtnClick: React.MouseEventHandler
    onEditBtnClick: React.MouseEventHandler
    onCommentChange: React.KeyboardEventHandler<HTMLTextAreaElement>
}

export type PageInteractionProps = Omit<
    InteractionProps,
    'onReplyBtnClick' | 'onEditBtnClick' | 'onCommentChange'
>

// NOTE: Derived type - edit the original
export type PageInteractionAugdProps = {
    [Key in keyof PageInteractionProps]: (
        day: number,
        pageId: string,
    ) => InteractionProps[Key]
}

export type NoteInteractionProps = Omit<
    InteractionProps,
    'onNotesBtnClick' | 'onListPickerBtnClick'
>

// NOTE: Derived type - edit the original
export type NoteInteractionAugdProps = {
    [Key in keyof NoteInteractionProps]: (
        noteId: string,
    ) => InteractionProps[Key]
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

export type PageData = Pick<PipelineRes, 'fullUrl' | 'fullTitle' | 'tags'> & {
    normalizedUrl: string
    lists: string[]
    displayTime: number
    isBookmarked: boolean
    isDeleteModalShown: boolean
}

export interface NoteResult {
    isEditing: boolean
    isBookmarked: boolean
    areRepliesShown: boolean
    isTagPickerShown: boolean
    isCopyPasterShown: boolean
    isDeleteModalShown: boolean
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
    searchType: SearchType

    /** Holds page data specific to each page occurence on a specific day. */
    results: { [day: number]: PageResultsByDay }

    // Display data lookups
    /** Holds page data shared with all page occurences on any day. */
    pageData: NormalizedState<PageData>
    noteData: NormalizedState<NoteData & NoteResult>

    // Async operation states
    searchState: TaskState
    paginationState: TaskState
    noteUpdateState: TaskState
    newNoteCreateState: TaskState
}

interface PageEventArgs {
    pageId: string
    day: number
}

interface NoteEventArgs {
    noteId: string
}

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
    setPageDeleteModalShown: { id: string; isShown: boolean }

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
    setNoteDeleteModalShown: NoteEventArgs & { isShown: boolean }
    setNoteCopyPasterShown: NoteEventArgs & { isShown: boolean }
    setNoteTagPickerShown: NoteEventArgs & { isShown: boolean }
    setNoteRepliesShown: NoteEventArgs & { areShown: boolean }
    setNoteBookmark: NoteEventArgs & { isBookmarked: boolean }
    setNoteEditing: NoteEventArgs & { isEditing: boolean }
    setNoteTags: NoteEventArgs & { added?: string; deleted?: string }

    // Note edit form state mutations
    setNoteEditCommentValue: NoteEventArgs & { value: string }
    cancelNoteEdit: NoteEventArgs
    saveNoteEdit: NoteEventArgs

    // Misc data setters
    setPageData: { pages: PageData[] }
    setPageSearchResult: { result: StandardSearchResponse }
    setAnnotationSearchResult: { result: AnnotationsSearchResponse }
}>
