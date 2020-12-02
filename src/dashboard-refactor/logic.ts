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

    setPageNewNoteTagPickerShown: EventHandler<
        'setPageNewNoteTagPickerShown'
    > = ({ event }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    newNoteForm: {
                                        isTagPickerShown: {
                                            $set: event.isShown,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNewNoteTags: EventHandler<'setPageNewNoteTags'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    newNoteForm: { tags: { $set: event.tags } },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNewNoteCommentValue: EventHandler<'setPageNewNoteCommentValue'> = ({
        event,
    }) => {
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

    cancelPageNewNoteEdit: EventHandler<'cancelPageNewNoteEdit'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    newNoteForm: {
                                        $set: utils.getInitialFormState(),
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    savePageNewNoteEdit: EventHandler<'savePageNewNoteEdit'> = async ({
        event,
        previousState,
    }) => {
        const formState =
            previousState.searchResults.results[event.day].pages.byId[
                event.pageId
            ].newNoteForm

        // TODO: Call BG
        const newNoteId = Date.now().toString()

        this.emitMutation({
            searchResults: {
                noteData: {
                    allIds: { $push: [newNoteId] },
                    byId: {
                        [newNoteId]: {
                            $set: {
                                url: newNoteId,
                                displayTime: Date.now(),
                                comment: formState.inputValue,
                                tags: formState.tags,
                                isEditing: false,
                                editNoteForm: utils.getInitialFormState(),
                            },
                        },
                    },
                },
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    newNoteForm: {
                                        $set: utils.getInitialFormState(),
                                    },
                                    noteIds: {
                                        user: { $push: [newNoteId] },
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
                            editNoteForm: {
                                isTagPickerShown: { $set: event.isShown },
                            },
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
                            editNoteForm: {
                                tags: { $set: event.tags },
                            },
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
                            editNoteForm: {
                                inputValue: { $set: event.value },
                            },
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
        const { comment, tags } = previousState.searchResults.noteData.byId[
            event.noteId
        ]

        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isEditing: { $set: false },
                            editNoteForm: {
                                isTagPickerShown: { $set: false },
                                inputValue: { $set: comment ?? '' },
                                tags: { $set: tags ?? [] },
                            },
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
        const { inputValue, tags } = previousState.searchResults.noteData.byId[
            event.noteId
        ].editNoteForm

        // TODO: call BG

        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isEditing: { $set: false },
                            comment: { $set: inputValue },
                            tags: { $set: tags },
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
