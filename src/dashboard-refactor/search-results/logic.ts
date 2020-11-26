import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'

import { RootState as State, NotesType, Note, Page } from './types'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'

interface PageNotesEventArgs {
    pageId: string
    day: number
}

export type Events = UIEvent<{
    setPageBookmark: { id: string; isBookmarked: boolean }

    setPageNotesShown: PageNotesEventArgs & { areShown: boolean }
    setPageNotesSort: PageNotesEventArgs & { sortingFn: AnnotationsSorter }
    setPageNotesType: PageNotesEventArgs & { noteType: NotesType }

    setPagesLookup: { pages: Page[] }

    example: null
}>

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export class SearchResultsLogic extends UILogic<State, Events> {
    getInitialState(): State {
        return {
            results: {},
            pagesLookup: {
                allIds: [],
                byId: {},
            },
            notesLookup: {
                allIds: [],
                byId: {},
            },
            searchType: 'pages',
            areAllNotesShown: false,
            searchState: 'pristine',
            paginationState: 'pristine',
        }
    }

    setPageBookmark: EventHandler<'setPageBookmark'> = ({ event }) => {
        this.emitMutation({
            pagesLookup: {
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

    setPagesLookup: EventHandler<'setPagesLookup'> = ({ event: { pages } }) => {
        const allIds = pages.map((page) => page.normalizedUrl)
        const byId = pages.reduce(
            (acc, curr) => ({ ...acc, [curr.normalizedUrl]: curr }),
            {},
        )

        this.emitMutation({
            pagesLookup: { allIds: { $set: allIds }, byId: { $set: byId } },
        })
    }

    example: EventHandler<'example'> = ({ event }) => {
        this.emitMutation({})
    }
}
