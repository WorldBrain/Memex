import { TaskState } from 'ui-logic-core/lib/types'
import { UIEvent } from 'ui-logic-core'

import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    AnnotationsSearchResponse,
    StandardSearchResponse,
} from 'src/search/background/types'

export type SearchResultToState = (
    result: AnnotationsSearchResponse | StandardSearchResponse,
) => Pick<RootState, 'results' | 'noteData' | 'pageData'>
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

export interface PageResultsByDay {
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

interface PageNotesEventArgs {
    pageId: string
    day: number
}

export type Events = UIEvent<{
    // Root state mutations
    setSearchType: { searchType: SearchType }
    setAllNotesShown: { areShown: boolean }

    // Page data state mutations (*shared with all* occurences of the page in different days)
    setPageBookmark: { id: string; isBookmarked: boolean }

    // Page result state mutations (*specific to each* occurence of the page in different days)
    setPageNotesShown: PageNotesEventArgs & { areShown: boolean }
    setPageNotesSort: PageNotesEventArgs & { sortingFn: AnnotationsSorter }
    setPageNotesType: PageNotesEventArgs & { noteType: NotesType }
    setPageNewNoteValue: PageNotesEventArgs & { value: string }

    // Misc data setters
    setPageData: { pages: PageData[] }
    setPageSearchResult: { result: StandardSearchResponse }
    setAnnotationSearchResult: { result: AnnotationsSearchResponse }
}>
