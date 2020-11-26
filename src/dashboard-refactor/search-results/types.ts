import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'

type Note = any
type Page = any
type NoteType = 'search' | 'user' | 'followed'

interface NewNoteFormState {
    inputValue: string
    // TODO: work out these states (may re-use from sidebar state)
}

interface NoteState {
    id: string
    // TODO: work out individual note states
}

interface PageState {
    id: string
    noteType: NoteType
    areNotesShown: boolean
    sortingFn: AnnotationsSorter
    newNoteForm: NewNoteFormState
    notes: { [name in NoteType]: NoteState[] }
}

interface ResultsByDay {
    date: Date
    pages: PageState[]
}

export interface RootState {
    results: ResultsByDay[]
    areAllNotesShown: boolean
    searchType: 'pages' | 'notes'
    pagesLookup: { [id: string]: Page }
    notesLookup: { [id: string]: Note }
}
