import { TaskState } from 'ui-logic-core/lib/types'

import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'

export type NotesType = 'search' | 'user' | 'followed'

interface NormalizedState<T> {
    allIds: string[]
    byId: { [id: string]: T }
}

export interface Note {
    url: string
    comment?: string
    highlight?: string
    editedAt?: Date
    createdAt: Date
}

export interface Page {
    normalizedUrl: string
    fullUrl: string
    title: string
    createdAt: Date
    isBookmarked: boolean
}

interface NewNoteFormState {
    inputValue: string
    // TODO: work out these states (may re-use from sidebar state)
}

interface ResultsByDay {
    day: number
    pages: NormalizedState<{
        id: string
        notesType: NotesType
        areNotesShown: boolean
        loadNotesState: TaskState
        sortingFn: AnnotationsSorter
        newNoteForm: NewNoteFormState
        noteIds: { [key in NotesType]: string[] }
    }>
}

export interface RootState {
    results: { [day: number]: ResultsByDay }
    areAllNotesShown: boolean
    searchType: 'pages' | 'notes'
    searchState: TaskState
    paginationState: TaskState

    pagesLookup: NormalizedState<Page>
    notesLookup: NormalizedState<Note>
}
