import { UILogic, UIEvent, UIEventHandler } from 'ui-logic-core'

import {
    RootState as State,
    NotesType,
    PageData,
    PageResult,
    SearchType,
    SearchResultsDependencies,
} from './types'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    StandardSearchResponse,
    AnnotationsSearchResponse,
} from 'src/search/background/types'
import * as utils from './util'

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

    example: null
}>

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export class SearchResultsLogic extends UILogic<State, Events> {
    constructor(private options: SearchResultsDependencies) {
        super()
    }

    getInitialState(): State {
        return {
            results: {},
            pageData: {
                allIds: [],
                byId: {},
            },
            noteData: {
                allIds: [],
                byId: {},
            },
            searchType: 'pages',
            areAllNotesShown: false,
            searchState: 'pristine',
            paginationState: 'pristine',
        }
    }

    setPageSearchResult: EventHandler<'setPageSearchResult'> = ({ event }) => {
        const state = utils.pageSearchResultToState(event.result)
        this.emitMutation({
            results: { $set: state.results },
            noteData: { $set: state.noteData },
            pageData: { $set: state.pageData },
        })
    }

    setAnnotationSearchResult: EventHandler<'setAnnotationSearchResult'> = ({
        event,
    }) => {
        const state = utils.annotationSearchResultToState(event.result)
        this.emitMutation({
            results: { $set: state.results },
            noteData: { $set: state.noteData },
            pageData: { $set: state.pageData },
        })
    }

    setPageBookmark: EventHandler<'setPageBookmark'> = ({ event }) => {
        this.emitMutation({
            pageData: {
                byId: {
                    [event.id]: { isBookmarked: { $set: event.isBookmarked } },
                },
            },
        })
    }

    setPageNotesShown: EventHandler<'setPageNotesShown'> = ({ event }) => {
        this.emitMutation({
            results: {
                [event.day]: {
                    pages: {
                        byId: {
                            [event.pageId]: {
                                areNotesShown: { $set: event.areShown },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNotesSort: EventHandler<'setPageNotesSort'> = ({ event }) => {
        this.emitMutation({
            results: {
                [event.day]: {
                    pages: {
                        byId: {
                            [event.pageId]: {
                                sortingFn: { $set: event.sortingFn },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNotesType: EventHandler<'setPageNotesType'> = ({ event }) => {
        this.emitMutation({
            results: {
                [event.day]: {
                    pages: {
                        byId: {
                            [event.pageId]: {
                                notesType: { $set: event.noteType },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNewNoteValue: EventHandler<'setPageNewNoteValue'> = ({ event }) => {
        this.emitMutation({
            results: {
                [event.day]: {
                    pages: {
                        byId: {
                            [event.pageId]: {
                                newNoteForm: {
                                    inputValue: { $set: event.value },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageData: EventHandler<'setPageData'> = ({ event: { pages } }) => {
        const allIds = pages.map((page) => page.normalizedUrl)
        const byId = pages.reduce(
            (acc, curr) => ({ ...acc, [curr.normalizedUrl]: curr }),
            {},
        )

        this.emitMutation({
            pageData: { allIds: { $set: allIds }, byId: { $set: byId } },
        })
    }

    setSearchType: EventHandler<'setSearchType'> = ({ event }) => {
        this.emitMutation({ searchType: { $set: event.searchType } })
    }

    setAllNotesShown: EventHandler<'setAllNotesShown'> = ({ event }) => {
        this.emitMutation({ areAllNotesShown: { $set: event.areShown } })
    }

    example: EventHandler<'example'> = ({ event }) => {
        this.emitMutation({})
    }
}
