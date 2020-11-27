import { TaskState } from 'ui-logic-core/lib/types'

import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'

export type SearchType = 'pages' | 'notes'
export type NotesType = 'search' | 'user' | 'followed'

export interface NormalizedState<T> {
    allIds: string[]
    byId: { [id: string]: T }
}

export interface NoteData {
    url: string
    comment?: string
    highlight?: string
    displayTime: number
}

export interface PageData {
    normalizedUrl: string
    fullUrl: string
    title: string
    displayTime: number
    isBookmarked: boolean
}

interface NewNoteFormState {
    inputValue: string
    // TODO: work out these states (may re-use from sidebar state)
}

export interface PageResult {
    id: string
    notesType: NotesType
    areNotesShown: boolean
    loadNotesState: TaskState
    sortingFn: AnnotationsSorter
    newNoteForm: NewNoteFormState
    noteIds: { [key in NotesType]: string[] }
}

interface PageResultsByDay {
    day: number
    pages: NormalizedState<PageResult>
}

export interface RootState {
    searchType: SearchType
    areAllNotesShown: boolean

    /** Holds page data specific to each page occurence on a specific day. */
    results: { [day: number]: PageResultsByDay }

    // Disply data lookups
    /** Holds page data shared with all page occurences on any day. */
    pageData: NormalizedState<PageData>
    noteData: NormalizedState<NoteData>

    // Async operation states
    searchState: TaskState
    paginationState: TaskState
}
