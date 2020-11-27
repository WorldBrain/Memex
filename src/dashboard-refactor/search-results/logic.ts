import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'

import { runInBackground } from 'src/util/webextensionRPC'
import {
    RootState as State,
    NotesType,
    PageData,
    NormalizedState,
    PageResult,
    SearchType,
    SearchResultsDependencies,
} from './types'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    SearchInterface,
    StandardSearchResponse,
} from 'src/search/background/types'

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

    example: null
}>

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export class SearchResultsLogic extends UILogic<State, Events> {
    getInitialPageResultState = (id: string): PageResult => ({
        id,
        notesType: 'user',
        areNotesShown: false,
        sortingFn: (a, b) => 1,
        loadNotesState: 'pristine',
        newNoteForm: { inputValue: '' },
        noteIds: { user: [], followed: [], search: [] },
    })
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

    setPageSearchResultState(result: StandardSearchResponse) {
        const pageData: NormalizedState<PageData> = {
            allIds: [],
            byId: {},
        }
        const pageResults: NormalizedState<PageResult> = {
            allIds: [],
            byId: {},
        }

        for (const pageResult of result.docs) {
            const id = pageResult.url

            pageData.byId[id] = {
                title: pageResult.title,
                fullUrl: pageResult.url,
                normalizedUrl: pageResult.url,
                displayTime: pageResult.displayTime,
                isBookmarked: pageResult.hasBookmark,
            }
            pageResults.byId[id] = this.getInitialPageResultState(
                pageResult.url,
            )

            pageData.allIds.push(id)
            pageResults.allIds.push(id)
        }

        this.emitMutation({
            pageData: { $set: pageData },
            results: {
                $set: {
                    [-1]: {
                        day: -1,
                        pages: pageResults,
                    },
                },
            },
        })
    }

    setPageSearchResult: EventHandler<'setPageSearchResult'> = ({ event }) => {
        this.setPageSearchResultState(event.result)
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
