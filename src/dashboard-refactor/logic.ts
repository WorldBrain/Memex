import { UILogic, UIEventHandler } from 'ui-logic-core'

import * as utils from './search-results/util'
import { executeUITask } from 'src/util/ui-logic'
import { runInBackground } from 'src/util/webextensionRPC'
import { SearchInterface } from 'src/search/background/types'
import { RootState as State, DashboardDependencies, Events } from './types'

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export class DashboardLogic extends UILogic<State, Events> {
    private searchBG = runInBackground<SearchInterface>()

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
            searchFilters: {
                searchQuery: '',
                isSearchBarFocused: false,
                domainsExcluded: [],
                domainsIncluded: [],
                isDateFilterActive: false,
                isDomainFilterActive: false,
                isTagFilterActive: false,
                searchFiltersOpen: false,
                tagsExcluded: [],
                tagsIncluded: [],
                dateFromInput: '',
                dateToInput: '',
            },
        }
    }

    /* START - Misc event handlers */
    searchPages: EventHandler<'searchPages'> = async ({
        previousState: { searchFilters },
    }) => {
        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { searchState: { $set: taskState } },
            }),
            async () => {
                const result = await this.searchBG.searchPages({
                    contentTypes: {
                        pages: true,
                        highlights: false,
                        notes: false,
                    },
                    endDate: searchFilters.dateTo,
                    startDate: searchFilters.dateFrom,
                    query: searchFilters.searchQuery,
                    domainsInc: searchFilters.domainsIncluded,
                    domainsExc: searchFilters.domainsExcluded,
                    tagsInc: searchFilters.tagsIncluded,
                    tagsExc: searchFilters.tagsExcluded,
                })

                const {
                    noteData,
                    pageData,
                    results,
                } = utils.pageSearchResultToState(result)

                this.emitMutation({
                    searchResults: {
                        results: { $set: results },
                        pageData: { $set: pageData },
                        noteData: { $set: noteData },
                    },
                })
            },
        )
    }

    searchNotes: EventHandler<'searchNotes'> = async ({
        previousState: { searchFilters },
    }) => {
        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { searchState: { $set: taskState } },
            }),
            async () => {
                const result = await this.searchBG.searchAnnotations({
                    endDate: searchFilters.dateTo,
                    startDate: searchFilters.dateFrom,
                    query: searchFilters.searchQuery,
                    domainsInc: searchFilters.domainsIncluded,
                    domainsExc: searchFilters.domainsExcluded,
                    tagsInc: searchFilters.tagsIncluded,
                    tagsExc: searchFilters.tagsExcluded,
                })

                const {
                    noteData,
                    pageData,
                    results,
                } = utils.annotationSearchResultToState(result)

                this.emitMutation({
                    searchResults: {
                        results: { $set: results },
                        pageData: { $set: pageData },
                        noteData: { $set: noteData },
                    },
                })
            },
        )
    }
    /* END - Misc event handlers */

    /* START - search result event handlers */
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
    /* END - search result event handlers */

    /* START - search filter event handlers */
    setSearchQuery: EventHandler<'setSearchQuery'> = async ({ event }) => {
        this.emitMutation({
            searchFilters: { searchQuery: { $set: event.query } },
        })
    }

    setSearchBarFocus: EventHandler<'setSearchBarFocus'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { isSearchBarFocused: { $set: event.isFocused } },
        })
    }

    setSearchFiltersOpen: EventHandler<'setSearchFiltersOpen'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { searchFiltersOpen: { $set: event.isOpen } },
        })
    }

    setTagFilterActive: EventHandler<'setTagFilterActive'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { isTagFilterActive: { $set: event.isActive } },
        })
    }

    setDateFilterActive: EventHandler<'setDateFilterActive'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { isDateFilterActive: { $set: event.isActive } },
        })
    }

    setDomainFilterActive: EventHandler<'setDomainFilterActive'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { isDomainFilterActive: { $set: event.isActive } },
        })
    }

    setDateFromInputValue: EventHandler<'setDateFromInputValue'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { dateFromInput: { $set: event.value } },
        })
    }

    setDateToInputValue: EventHandler<'setDateToInputValue'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { dateToInput: { $set: event.value } },
        })
    }

    setDateFrom: EventHandler<'setDateFrom'> = async ({ event }) => {
        this.emitMutation({
            searchFilters: { dateFrom: { $set: event.value } },
        })
    }

    setDateTo: EventHandler<'setDateTo'> = async ({ event }) => {
        this.emitMutation({ searchFilters: { dateTo: { $set: event.value } } })
    }

    addIncludedTag: EventHandler<'addIncludedTag'> = async ({ event }) => {
        this.emitMutation({
            searchFilters: { tagsIncluded: { $push: [event.tag] } },
        })
    }

    delIncludedTag: EventHandler<'delIncludedTag'> = async ({
        event,
        previousState,
    }) => {
        const index = previousState.searchFilters.tagsIncluded.findIndex(
            (tag) => tag === event.tag,
        )

        if (index === -1) {
            return
        }

        this.emitMutation({
            searchFilters: { tagsIncluded: { $splice: [[index, 1]] } },
        })
    }

    addExcludedTag: EventHandler<'addExcludedTag'> = async ({ event }) => {
        this.emitMutation({
            searchFilters: { tagsExcluded: { $push: [event.tag] } },
        })
    }

    delExcludedTag: EventHandler<'delExcludedTag'> = async ({
        event,
        previousState,
    }) => {
        const index = previousState.searchFilters.tagsExcluded.findIndex(
            (tag) => tag === event.tag,
        )

        if (index === -1) {
            return
        }

        this.emitMutation({
            searchFilters: { tagsExcluded: { $splice: [[index, 1]] } },
        })
    }

    addIncludedDomain: EventHandler<'addIncludedDomain'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { domainsIncluded: { $push: [event.domain] } },
        })
    }

    delIncludedDomain: EventHandler<'delIncludedDomain'> = async ({
        event,
        previousState,
    }) => {
        const index = previousState.searchFilters.domainsIncluded.findIndex(
            (tag) => tag === event.domain,
        )

        if (index === -1) {
            return
        }

        this.emitMutation({
            searchFilters: { domainsIncluded: { $splice: [[index, 1]] } },
        })
    }

    addExcludedDomain: EventHandler<'addExcludedDomain'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { domainsExcluded: { $push: [event.domain] } },
        })
    }

    delExcludedDomain: EventHandler<'delExcludedDomain'> = async ({
        event,
        previousState,
    }) => {
        const index = previousState.searchFilters.domainsExcluded.findIndex(
            (tag) => tag === event.domain,
        )

        if (index === -1) {
            return
        }

        this.emitMutation({
            searchFilters: { domainsExcluded: { $splice: [[index, 1]] } },
        })
    }

    setTagsIncluded: EventHandler<'setTagsIncluded'> = async ({ event }) => {
        this.emitMutation({
            searchFilters: { tagsIncluded: { $set: event.tags } },
        })
    }

    setTagsExcluded: EventHandler<'setTagsExcluded'> = async ({ event }) => {
        this.emitMutation({
            searchFilters: { tagsExcluded: { $set: event.tags } },
        })
    }

    setDomainsIncluded: EventHandler<'setDomainsIncluded'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { domainsIncluded: { $set: event.domains } },
        })
    }

    setDomainsExcluded: EventHandler<'setDomainsExcluded'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { domainsExcluded: { $set: event.domains } },
        })
    }

    resetFilters: EventHandler<'resetFilters'> = async ({ event }) => {
        this.emitMutation({
            searchFilters: { $set: this.getInitialState().searchFilters },
        })
    }
    /* END - search filter event handlers */

    example: EventHandler<'example'> = ({ event }) => {
        this.emitMutation({})
    }
}
