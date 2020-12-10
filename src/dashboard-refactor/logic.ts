import { UILogic, UIEventHandler } from 'ui-logic-core'

import * as utils from './search-results/util'
import { executeUITask } from 'src/util/ui-logic'
import { runInBackground } from 'src/util/webextensionRPC'
import { SearchInterface } from 'src/search/background/types'
import { RootState as State, DashboardDependencies, Events } from './types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { haveTagsChanged } from 'src/util/have-tags-changed'

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export class DashboardLogic extends UILogic<State, Events> {
    private listsBG = runInBackground<RemoteCollectionsInterface>()
    private searchBG = runInBackground<SearchInterface>()
    private annotationsBG = runInBackground<AnnotationInterface<'caller'>>()

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
                noteUpdateState: 'pristine',
                newNoteCreateState: 'pristine',
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
            listsSidebar: {
                newListCreateState: 'pristine',
                isSidebarPeeking: false,
                isSidebarLocked: false,
                searchQuery: '',
                listData: {},
                followedLists: {
                    loadingState: 'pristine',
                    isExpanded: false,
                    listIds: [],
                },
                localLists: {
                    isAddInputShown: false,
                    addInputValue: '',
                    loadingState: 'pristine',
                    isExpanded: false,
                    listIds: [],
                },
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

    setPageDeleteModalShown: EventHandler<'setPageDeleteModalShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                pageData: {
                    byId: {
                        [event.id]: {
                            isDeleteModalShown: { $set: event.isShown },
                        },
                    },
                },
            },
        })
    }

    setPageCopyPasterShown: EventHandler<'setPageCopyPasterShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    isCopyPasterShown: { $set: event.isShown },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageListPickerShown: EventHandler<'setPageListPickerShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    isListPickerShown: { $set: event.isShown },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageTagPickerShown: EventHandler<'setPageTagPickerShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    isTagPickerShown: { $set: event.isShown },
                                },
                            },
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

    cancelPageNewNote: EventHandler<'cancelPageNewNote'> = ({ event }) => {
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

    savePageNewNote: EventHandler<'savePageNewNote'> = async ({
        event,
        previousState,
    }) => {
        const formState =
            previousState.searchResults.results[event.day].pages.byId[
                event.pageId
            ].newNoteForm

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { newNoteCreateState: { $set: taskState } },
            }),
            async () => {
                const newNoteId = await this.annotationsBG.createAnnotation({
                    pageUrl: event.pageId,
                    comment: formState.inputValue,
                })
                if (formState.tags.length) {
                    await this.annotationsBG.updateAnnotationTags({
                        url: newNoteId,
                        tags: formState.tags,
                    })
                }

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
                                        ...utils.getInitialNoteResultState(),
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
            },
        )
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

    setNoteEditing: EventHandler<'setNoteEditing'> = ({ event }) => {
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

    setNoteTagPickerShown: EventHandler<'setNoteTagPickerShown'> = ({
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

    setNoteListPickerShown: EventHandler<'setNoteListPickerShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isListPickerShown: { $set: event.isShown },
                        },
                    },
                },
            },
        })
    }

    setNoteCopyPasterShown: EventHandler<'setNoteCopyPasterShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isCopyPasterShown: { $set: event.isShown },
                        },
                    },
                },
            },
        })
    }

    setNoteDeleteModalShown: EventHandler<'setNoteDeleteModalShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isDeleteModalShown: { $set: event.isShown },
                        },
                    },
                },
            },
        })
    }

    setNoteRepliesShown: EventHandler<'setNoteRepliesShown'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            areRepliesShown: { $set: event.areShown },
                        },
                    },
                },
            },
        })
    }

    setNoteBookmark: EventHandler<'setNoteBookmark'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isBookmarked: { $set: event.isBookmarked },
                        },
                    },
                },
            },
        })
    }

    setNoteTags: EventHandler<'setNoteTags'> = ({ event }) => {
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

    setNoteEditCommentValue: EventHandler<'setNoteEditCommentValue'> = ({
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

    cancelNoteEdit: EventHandler<'cancelNoteEdit'> = ({
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

    saveNoteEdit: EventHandler<'saveNoteEdit'> = async ({
        event,
        previousState,
    }) => {
        const {
            editNoteForm,
            ...noteData
        } = previousState.searchResults.noteData.byId[event.noteId]
        const tagsHaveChanged = haveTagsChanged(
            noteData.tags,
            editNoteForm.tags,
        )

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { noteUpdateState: { $set: taskState } },
            }),
            async () => {
                await this.annotationsBG.editAnnotation(
                    event.noteId,
                    editNoteForm.inputValue,
                )
                if (tagsHaveChanged) {
                    await this.annotationsBG.updateAnnotationTags({
                        url: event.noteId,
                        tags: editNoteForm.tags,
                    })
                }

                this.emitMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [event.noteId]: {
                                    isEditing: { $set: false },
                                    comment: { $set: editNoteForm.inputValue },
                                    tags: { $set: editNoteForm.tags },
                                },
                            },
                        },
                    },
                })
            },
        )
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

    /* START - lists sidebar event handlers */
    setSidebarLocked: EventHandler<'setSidebarLocked'> = async ({ event }) => {
        this.emitMutation({
            listsSidebar: { isSidebarLocked: { $set: event.isLocked } },
        })
    }

    setSidebarPeeking: EventHandler<'setSidebarPeeking'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: { isSidebarPeeking: { $set: event.isPeeking } },
        })
    }

    setListQueryValue: EventHandler<'setListQueryValue'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: { searchQuery: { $set: event.value } },
        })
    }

    setAddListInputValue: EventHandler<'setAddListInputValue'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                localLists: { addInputValue: { $set: event.value } },
            },
        })
    }

    setAddListInputShown: EventHandler<'setAddListInputShown'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                localLists: { isAddInputShown: { $set: event.isShown } },
            },
        })
    }

    addNewList: EventHandler<'addNewList'> = async ({
        previousState: { listsSidebar },
    }) => {
        const newListName = listsSidebar.localLists.addInputValue.trim()

        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: { newListCreateState: { $set: taskState } },
            }),
            async () => {
                const listId = await this.listsBG.createCustomList({
                    name: newListName,
                })

                this.emitMutation({
                    listsSidebar: {
                        localLists: { listIds: { $push: [listId] } },
                        listData: {
                            [listId]: {
                                $set: { id: listId, name: newListName },
                            },
                        },
                    },
                })
            },
        )
    }

    setLocalListsExpanded: EventHandler<'setLocalListsExpanded'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                localLists: { isExpanded: { $set: event.isExpanded } },
            },
        })
    }

    setFollowedListsExpanded: EventHandler<
        'setFollowedListsExpanded'
    > = async ({ event }) => {
        this.emitMutation({
            listsSidebar: {
                followedLists: { isExpanded: { $set: event.isExpanded } },
            },
        })
    }

    setSelectedListId: EventHandler<'setSelectedListId'> = async ({
        event,
        previousState,
    }) => {
        const listIdToSet =
            previousState.listsSidebar.selectedListId === event.listId
                ? undefined
                : event.listId

        this.emitMutation({
            listsSidebar: { selectedListId: { $set: listIdToSet } },
        })
    }

    setLocalLists: EventHandler<'setLocalLists'> = async ({ event }) => {
        const listIds: number[] = []
        const listDataById = {}

        for (const list of event.lists) {
            listIds.push(list.id)
            listDataById[list.id] = list
        }

        this.emitMutation({
            listsSidebar: {
                listData: { $merge: listDataById },
                localLists: { listIds: { $set: listIds } },
            },
        })
    }

    setFollowedLists: EventHandler<'setFollowedLists'> = async ({ event }) => {
        const listIds: number[] = []
        const listDataById = {}

        for (const list of event.lists) {
            listIds.push(list.id)
            listDataById[list.id] = list
        }

        this.emitMutation({
            listsSidebar: {
                listData: { $merge: listDataById },
                followedLists: { listIds: { $set: listIds } },
            },
        })
    }
    /* END - lists sidebar event handlers */

    example: EventHandler<'example'> = ({ event }) => {
        this.emitMutation({})
    }
}
