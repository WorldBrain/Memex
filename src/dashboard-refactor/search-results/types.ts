import { TaskState } from 'ui-logic-core/lib/types'

import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'

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
    results: { [day: number]: PageResultsByDay }
    areAllNotesShown: boolean
    searchType: 'pages' | 'notes'

    searchState: TaskState
    paginationState: TaskState

    pageData: NormalizedState<PageData>
    noteData: NormalizedState<NoteData>
}
