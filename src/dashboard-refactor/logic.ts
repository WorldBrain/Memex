import { UILogic, UIEventHandler } from 'ui-logic-core'

import { RootState as State, DashboardDependencies, Events } from './types'
import * as utils from './search-results/util'

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export class SearchResultsLogic extends UILogic<State, Events> {
    constructor(private options: DashboardDependencies) {
        super()
    }

    getInitialState(): State {
        return {
            searchResults: {
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
            },
        }
    }

    setPageSearchResult: EventHandler<'setPageSearchResult'> = ({ event }) => {
        const state = utils.pageSearchResultToState(event.result)
        this.emitMutation({
            searchResults: {
                results: { $set: state.results },
                noteData: { $set: state.noteData },
                pageData: { $set: state.pageData },
            },
        })
    }

    setAnnotationSearchResult: EventHandler<'setAnnotationSearchResult'> = ({
        event,
    }) => {
        const state = utils.annotationSearchResultToState(event.result)
        this.emitMutation({
            searchResults: {
                results: { $set: state.results },
                noteData: { $set: state.noteData },
                pageData: { $set: state.pageData },
            },
        })
    }

    setPageBookmark: EventHandler<'setPageBookmark'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                pageData: {
                    byId: {
                        [event.id]: {
                            isBookmarked: { $set: event.isBookmarked },
                        },
                    },
                },
            },
        })
    }

    setPageNotesShown: EventHandler<'setPageNotesShown'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
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
            },
        })
    }

    setPageNotesSort: EventHandler<'setPageNotesSort'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
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
            },
        })
    }

    setPageNotesType: EventHandler<'setPageNotesType'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
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
            },
        })
    }

    setPageNewNoteValue: EventHandler<'setPageNewNoteValue'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
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
            searchResults: {
                pageData: { allIds: { $set: allIds }, byId: { $set: byId } },
            },
        })
    }

    setSearchType: EventHandler<'setSearchType'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                searchType: { $set: event.searchType },
            },
        })
    }

    setAllNotesShown: EventHandler<'setAllNotesShown'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                areAllNotesShown: { $set: event.areShown },
            },
        })
    }

    setPageNoteEditing: EventHandler<'setPageNoteEditing'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isEditing: { $set: event.isEditing },
                        },
                    },
                },
            },
        })
    }

    setPageNoteTagPickerShown: EventHandler<'setPageNoteTagPickerShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isTagPickerShown: { $set: event.isShown },
                        },
                    },
                },
            },
        })
    }

    setPageNoteTags: EventHandler<'setPageNoteTags'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            tags: { $set: event.tags },
                        },
                    },
                },
            },
        })
    }

    setPageNoteCommentValue: EventHandler<'setPageNoteCommentValue'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            commentEditValue: { $set: event.value },
                        },
                    },
                },
            },
        })
    }

    cancelPageNoteEdit: EventHandler<'cancelPageNoteEdit'> = ({
        event,
        previousState,
    }) => {
        const { comment } = previousState.searchResults.noteData.byId[
            event.noteId
        ]

        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isEditing: { $set: false },
                            commentEditValue: { $set: comment ?? '' },
                        },
                    },
                },
            },
        })
    }

    savePageNoteEdit: EventHandler<'savePageNoteEdit'> = async ({
        event,
        previousState,
    }) => {
        const { commentEditValue } = previousState.searchResults.noteData.byId[
            event.noteId
        ]

        // TODO: call BG

        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isEditing: { $set: false },
                            comment: { $set: commentEditValue },
                        },
                    },
                },
            },
        })
    }

    example: EventHandler<'example'> = ({ event }) => {
        this.emitMutation({})
    }
}
