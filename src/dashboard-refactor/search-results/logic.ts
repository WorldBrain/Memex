import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'

import { runInBackground } from 'src/util/webextensionRPC'
import {
    RootState as State,
    NotesType,
    PageData,
    NormalizedState,
    PageResult,
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
    setPageBookmark: { id: string; isBookmarked: boolean }

    setPageNotesShown: PageNotesEventArgs & { areShown: boolean }
    setPageNotesSort: PageNotesEventArgs & { sortingFn: AnnotationsSorter }
    setPageNotesType: PageNotesEventArgs & { noteType: NotesType }

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
    private getInitialPageResultState = (id: string): PageResult => ({
        id,
        notesType: 'user',
        areNotesShown: false,
        sortingFn: (a, b) => 1,
        loadNotesState: 'pristine',
        newNoteForm: { inputValue: '' },
        noteIds: { user: [], followed: [], search: [] },
    })

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

    example: EventHandler<'example'> = ({ event }) => {
        this.emitMutation({})
    }
}
