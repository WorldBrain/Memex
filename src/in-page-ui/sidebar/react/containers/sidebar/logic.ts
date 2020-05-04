import {
    UILogic,
    UIEvent,
    IncomingUIEvent,
    UIEventHandler,
    UIMutation,
} from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'
import { SidebarEnv, Page, AnnotationMode } from '../../types'
import { Annotation } from 'src/annotations/types'
import { Result, ResultsByUrl } from 'src/overview/types'
import { PageUrlsByDay, SearchInterface } from 'src/search/background/types'
import { Anchor } from 'src/highlighting/types'
import { loadInitial, executeUITask } from 'src/util/ui-logic'
import { SidebarContainerDependencies } from './types'
import { AnnotationInterface } from 'src/direct-linking/background/types'

export interface SidebarContainerState {
    loadState: TaskState
    annotationLoadState: TaskState
    searchLoadState: TaskState

    state: 'visible' | 'hidden'
    // needsWaypoint: boolean
    // appendLoader: boolean

    annotations: Annotation[]
    annotationModes: {
        [context in AnnotationEventContext]: {
            [annotationUrl: string]: AnnotationMode
        }
    }
    // activeAnnotationUrl: {
    //     [context in AnnotationEventContext]: string
    // }
    hoverAnnotationUrl: {
        [context in AnnotationEventContext]: string
    }

    showCommentBox: boolean
    commentBox: {
        anchor: Anchor
        form: {
            isCommentBookmarked: boolean
            isTagInputActive: boolean
            showTagsPicker: boolean
            tagSuggestions: string[]
            commentText: string
            isAnnotation: boolean
            tags: string[]
            initTagSuggestions: string[]
        }
    }

    deletePageModal: {
        pageUrlToDelete?: string
        // isDeletePageModalShown: boolean
    }

    searchValue: string
    pageType: 'page' | 'all'
    searchType: 'notes' | 'page' | 'social'
    resultsSearchType: 'notes' | 'page' | 'social'
    pageCount?: number
    noResults: boolean
    isBadTerm: boolean
    searchResults: Result[]
    resultsByUrl: ResultsByUrl
    resultsClusteredByDay: boolean
    annotsByDay: PageUrlsByDay

    // Everything below here is temporary

    showCongratsMessage: boolean
    showClearFiltersBtn: boolean
    isSocialPost: boolean
    page: Page

    // Filter sidebar props
    showFiltersSidebar: boolean
    showSocialSearch: boolean
    // resultsSearchType: 'page' | 'notes' | 'social'

    annotCount?: number

    // Search result props
    shouldShowCount: boolean
    isInvalidSearch: boolean
    totalResultCount: number
    allAnnotationsExpanded: boolean

    isListFilterActive: boolean
    isSocialSearch: boolean
    tagSuggestions: string[]
}

export type SidebarContainerEvents = UIEvent<{
    show: null
    hide: null

    // Adding a new page comment
    addNewPageComment: null
    setNewPageCommentAnchor: { anchor: Anchor }
    changePageCommentText: { comment: string }
    saveNewPageComment: {
        anchor: Anchor
        commentText: string
        tags: string[]
        bookmarked: boolean
    }
    cancelNewPageComment: null
    toggleNewPageCommentBookmark: null
    togglePageCommentTags: null
    toggleNewPageCommentTagPicker: null
    addNewPageCommentTag: { tag: string }
    deleteNewPageCommentTag: { tag: string }
    // closeComments: null,

    // Delete page(s) modal
    deletePage: null
    closeDeletePageModal: null
    showDeletePageModal: { pageUrl: string }

    // Annotation boxes
    goToAnnotation: { context: AnnotationEventContext; annnotationUrl: string }
    editAnnotation: {
        context: AnnotationEventContext
        annotationUrl: string
        comment: string
        tags: string[]
    }
    deleteAnnotation: {
        context: AnnotationEventContext
        annotationUrl: string
    }
    toggleAnnotationBookmark: {
        context: AnnotationEventContext
        annnotationUrl: string
    }
    switchAnnotationMode: {
        context: AnnotationEventContext
        annotationUrl: string
        mode: AnnotationMode
    }
    annotationMouseEnter: {
        context: AnnotationEventContext
        annnotationUrl: string
    }
    annotationMouseLeave: {
        context: AnnotationEventContext
        annnotationUrl: string
    }

    // Search
    changeSearchQuery: { searchQuery: string }
    togglePageType: null
    setPageType: { type: 'page' | 'all' }
    setSearchType: { type: 'notes' | 'page' | 'social' }
    setResultsSearchType: { type: 'notes' | 'page' | 'social' }
    setAnnotationsExpanded: { value: boolean }
    toggleAllAnnotationsFold: null
    clearAllFilters: null
    fetchSuggestedTags: null
    fetchSuggestedDomains: null
    resetFiterPopups: null
    toggleShowFilters: null

    // Page search result interactions
    togglePageBookmark: { pageUrl: string }
    togglePageTagPicker: { pageUrl: string }
    togglePageAnnotationsView: { pageUrl: string }
}>
export type AnnotationEventContext = 'pageAnnotations' | 'searchResults'

export type SidebarContainerOptions = SidebarContainerDependencies & {
    env: SidebarEnv
}

type Incoming<EventName extends keyof SidebarContainerEvents> = IncomingUIEvent<
    SidebarContainerState,
    SidebarContainerEvents,
    EventName
>
type EventHandler<
    EventName extends keyof SidebarContainerEvents
> = UIEventHandler<SidebarContainerState, SidebarContainerEvents, EventName>

const INITIAL_COMMENT_BOX_STATE: SidebarContainerState['commentBox'] = {
    anchor: null,
    form: {
        isCommentBookmarked: false,
        isTagInputActive: false,
        showTagsPicker: false,
        tagSuggestions: [],
        commentText: '',
        isAnnotation: false,
        tags: [],
        initTagSuggestions: [],
    },
}

export class SidebarContainerLogic extends UILogic<
    SidebarContainerState,
    SidebarContainerEvents
>
// implements UIEventHandlers<SidebarContainerState, SidebarContainerEvents>
{
    constructor(private options: SidebarContainerOptions) {
        super()
    }

    getInitialState(): SidebarContainerState {
        return {
            loadState: 'pristine',
            annotationLoadState: 'pristine',
            searchLoadState: 'pristine',

            state: this.options.inPageUI.state.sidebar ? 'visible' : 'hidden',
            annotationModes: {
                pageAnnotations: {},
                searchResults: {},
            },

            commentBox: { ...INITIAL_COMMENT_BOX_STATE },
            deletePageModal: {
                pageUrlToDelete: undefined,
                // isDeletePageModalShown: false,
            },

            // pageType: 'all',
            pageType: 'page',
            searchType: 'notes',
            // searchType: 'page',
            resultsSearchType: 'page',

            allAnnotationsExpanded: false,
            isSocialPost: false,
            // needsWaypoint: false,
            // appendLoader: false,
            annotations: [],
            // activeAnnotationUrl: { pageAnnotations: '', searchResults: ''},
            hoverAnnotationUrl: { pageAnnotations: '', searchResults: '' },
            showCommentBox: false,
            searchValue: '',
            showCongratsMessage: false,
            showClearFiltersBtn: false,
            page: {} as any,
            showFiltersSidebar: false,
            showSocialSearch: false,
            pageCount: 0,
            annotCount: 0,
            noResults: false,
            isBadTerm: false,
            shouldShowCount: false,
            isInvalidSearch: false,
            totalResultCount: 0,
            isListFilterActive: false,
            searchResults: [],
            resultsByUrl: new Map(),
            resultsClusteredByDay: false,
            annotsByDay: {},
            isSocialSearch: false,
            tagSuggestions: [],
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        await loadInitial<SidebarContainerState>(this, async () => {
            await this._maybeLoad(previousState, {})
        })
    }

    private async _loadAnnotations() {
        // Notes tab
        await executeUITask(this, 'annotationLoadState', async () => {
            const annotations = await this.options.annotations.getAllAnnotationsByUrl(
                { url: this.options.currentTab.url },
            )
            this.emitMutation({ annotations: { $set: annotations } })
        })
    }

    private async _doSearch(
        state: Pick<
            SidebarContainerState,
            'searchType' | 'searchValue' | 'pageType'
        >,
    ) {
        // Pages tab
        await executeUITask(this, 'searchLoadState', async () => {
            if (state.searchType === 'page') {
                const results = (
                    await this.options.search.searchPages({
                        query: state.searchValue.length
                            ? state.searchValue
                            : undefined,
                        contentTypes: {
                            pages: true,
                            notes: true,
                            highlights: true,
                        },
                    })
                ).docs
                this.emitMutation({
                    searchResults: { $set: results },
                    pageCount: { $set: results.length },
                    noResults: { $set: !results.length },
                })
            } else if (state.searchType === 'notes') {
                const result = await searchAnnotations(
                    this.options.search,
                    state.searchValue,
                    // state.pageType === 'page'
                    //     ? this.options.currentTab.url
                    //     : null,
                )
                this.emitMutation({
                    searchResults: { $set: result.results },
                    pageCount: { $set: result.results.length },
                    noResults: { $set: !result.results.length },
                    annotsByDay: { $set: result.annotsByDay },
                    resultsByUrl: { $set: result.resultsByUrl },
                })
            }
        })
    }

    cleanup() {}

    show: EventHandler<'show'> = () => {
        return { state: { $set: 'visible' } }
    }

    hide: EventHandler<'hide'> = () => {
        return { state: { $set: 'hidden' } }
    }

    addNewPageComment: EventHandler<'addNewPageComment'> = async () => {
        this.emitMutation({ showCommentBox: { $set: true } })
        const suggestions = []
        this.emitMutation({
            commentBox: { form: { tagSuggestions: { $set: suggestions } } },
        })
    }

    setNewPageCommentAnchor: EventHandler<'setNewPageCommentAnchor'> = (
        incoming,
    ) => {
        return this.emitMutation({
            commentBox: { anchor: { $set: incoming.event.anchor } },
        })
    }

    changePageCommentText: EventHandler<'changePageCommentText'> = (
        incoming,
    ) => {
        return {
            commentBox: {
                form: { commentText: { $set: incoming.event.comment } },
            },
        }
    }

    saveNewPageComment: EventHandler<'saveNewPageComment'> = async ({
        event,
        previousState,
    }) => {
        const pageUrl = this.options.currentTab.url
        const dummyAnnotation = {
            pageUrl,
            tags: event.tags,
            comment: event.commentText,
            createdWhen: Date.now(),
            lastEdited: Date.now(),
            selector: event.anchor,
        } as Annotation

        const updateState = (args: { annotations: Annotation[] }) =>
            this.emitMutation({
                commentBox: { $set: INITIAL_COMMENT_BOX_STATE },
                showCommentBox: { $set: false },
                annotations: {
                    $set: args.annotations,
                },
            })

        updateState({
            annotations: [...previousState.annotations, dummyAnnotation],
        })

        try {
            const annotationUrl = await this.options.annotations.createAnnotation(
                {
                    url: pageUrl,
                    comment: event.commentText,
                    bookmarked: event.bookmarked,
                },
            )

            this.emitMutation({
                annotations: {
                    [previousState.annotations.length]: {
                        url: { $set: annotationUrl },
                    },
                },
            })

            for (const tag of event.tags) {
                await this.options.annotations.addAnnotationTag({
                    tag,
                    url: pageUrl,
                })
            }
        } catch (err) {
            updateState({ annotations: previousState.annotations })
            throw err
        }
    }

    cancelNewPageComment: EventHandler<'cancelNewPageComment'> = () => {
        // TODO: this.props.highlighter.removeTempHighlights()
        return {
            commentBox: { $set: INITIAL_COMMENT_BOX_STATE },
            showCommentBox: { $set: false },
        }
    }

    toggleNewPageCommentBookmark: EventHandler<
        'toggleNewPageCommentBookmark'
    > = () => {
        return {
            commentBox: {
                form: {
                    isCommentBookmarked: {
                        $apply: (bookmarked) => !bookmarked,
                    },
                },
            },
        }
    }

    toggleNewPageCommentTagPicker: EventHandler<
        'toggleNewPageCommentTagPicker'
    > = () => {
        return {
            commentBox: {
                form: { showTagsPicker: { $apply: (active) => !active } },
            },
        }
    }

    addNewPageCommentTag: EventHandler<'addNewPageCommentTag'> = (incoming) => {
        return {
            commentBox: {
                form: {
                    tags: {
                        $apply: (tags: string[]) => {
                            const tag = incoming.event.tag
                            return tags.includes(tag) ? tags : [...tags, tag]
                        },
                    },
                },
            },
        }
    }

    deleteNewPageCommentTag: EventHandler<'deleteNewPageCommentTag'> = (
        incoming,
    ) => {
        return {
            commentBox: {
                form: {
                    tags: {
                        $apply: (tags: string[]) => {
                            const tag = incoming.event.tag
                            const tagIndex = tags.indexOf(tag)
                            if (tagIndex === -1) {
                                return tags
                            }

                            tags = [...tags]
                            tags.splice(tagIndex, 1)
                            return tags
                        },
                    },
                },
            },
        }
    }

    goToAnnotation: EventHandler<'goToAnnotation'> = (incoming) => {}

    editAnnotation: EventHandler<'editAnnotation'> = async ({
        event,
        previousState,
    }) => {
        const resultIndex = previousState.annotations.findIndex(
            (annot) => annot.url === event.annotationUrl,
        )

        const updateState = (args: {
            tags: string[]
            comment?: string
            lastEdited: number
        }) =>
            this.emitMutation({
                annotationModes: {
                    [event.context]: {
                        [event.annotationUrl]: { $set: 'default' },
                    },
                },
                annotations: {
                    [resultIndex]: {
                        tags: { $set: args.tags },
                        comment: { $set: args.comment },
                        lastEdited: { $set: args.lastEdited },
                    },
                },
            })

        updateState({ ...event, lastEdited: Date.now() })

        try {
            await this.options.annotations.editAnnotation(
                event.annotationUrl,
                event.comment,
            )
            await this.options.annotations.updateAnnotationTags({
                url: event.annotationUrl,
                tags: event.tags,
            })
        } catch (err) {
            updateState({ ...previousState.annotations[resultIndex] })
            throw err
        }
    }

    deleteAnnotation: EventHandler<'deleteAnnotation'> = async ({
        event,
        previousState,
    }) => {
        const resultIndex = previousState.annotations.findIndex(
            (annot) => annot.url === event.annotationUrl,
        )

        const updateState = (args: { annotations: Annotation[] }) =>
            this.emitMutation({
                annotationModes: {
                    [event.context]: {
                        [event.annotationUrl]: { $set: 'default' },
                    },
                },
                annotations: {
                    $set: args.annotations,
                },
            })

        updateState({
            annotations: [
                ...previousState.annotations.slice(0, resultIndex),
                ...previousState.annotations.slice(resultIndex + 1),
            ],
        })

        try {
            await this.options.annotations.deleteAnnotation(event.annotationUrl)
        } catch (err) {
            updateState({ annotations: previousState.annotations })
            throw err
        }
    }

    toggleAnnotationBookmark: EventHandler<
        'toggleAnnotationBookmark'
    > = async ({ previousState, event }) => {
        const toggleBookmarkState = (hasBookmark: boolean) =>
            this.emitMutation({
                annotations: {
                    [annotationIndex]: {
                        hasBookmark: { $set: hasBookmark },
                    },
                },
            })

        const annotationIndex = previousState.annotations.findIndex(
            (annotation) => (annotation.url = event.annnotationUrl),
        )
        const currentlyBookmarked = !!previousState.annotations[annotationIndex]
            .hasBookmark
        const shouldBeBookmarked = !currentlyBookmarked
        toggleBookmarkState(shouldBeBookmarked)

        try {
            await this.options.annotations.toggleAnnotBookmark({
                url: event.annnotationUrl,
            })
        } catch (err) {
            toggleBookmarkState(!shouldBeBookmarked)
            throw err
        }
    }

    switchAnnotationMode: EventHandler<'switchAnnotationMode'> = (incoming) => {
        return {
            annotationModes: {
                [incoming.event.context]: {
                    [incoming.event.annotationUrl]: {
                        $set: incoming.event.mode,
                    },
                },
            },
        }
    }

    showDeletePageModal: EventHandler<'showDeletePageModal'> = ({ event }) => {
        return {
            deletePageModal: {
                pageUrlToDelete: { $set: event.pageUrl },
            },
        }
    }

    deletePage: EventHandler<'deletePage'> = async ({ previousState }) => {
        const { pageUrlToDelete } = previousState.deletePageModal
        const resultIndex = previousState.searchResults.findIndex(
            (result) => result.url === pageUrlToDelete,
        )

        this.emitMutation({
            searchResults: {
                $set: [
                    ...previousState.searchResults.slice(0, resultIndex),
                    ...previousState.searchResults.slice(resultIndex + 1),
                ],
            },
            deletePageModal: {
                pageUrlToDelete: { $set: undefined },
            },
        })

        try {
            await this.options.search.delPages([pageUrlToDelete])
        } catch (err) {
            this.emitMutation({
                searchResults: { $set: previousState.searchResults },
            })

            throw err
        }
    }

    closeDeletePageModal: EventHandler<'closeDeletePageModal'> = () => {
        return {
            deletePageModal: {
                pageUrlToDelete: { $set: undefined },
            },
        }
    }

    togglePageBookmark: EventHandler<'togglePageBookmark'> = async ({
        previousState,
        event,
    }) => {
        const toggleBookmarkState = (hasBookmark: boolean) =>
            this.emitMutation({
                searchResults: {
                    [resultIndex]: {
                        hasBookmark: { $set: hasBookmark },
                    },
                },
            })

        const resultIndex = previousState.searchResults.findIndex(
            (result) => result.url === event.pageUrl,
        )
        const currentlyBookmarked = !!previousState.searchResults[resultIndex]
            .hasBookmark
        const shouldBeBookmarked = !currentlyBookmarked

        toggleBookmarkState(shouldBeBookmarked)

        const pending = shouldBeBookmarked
            ? this.options.bookmarks.addPageBookmark({ url: event.pageUrl })
            : this.options.bookmarks.delPageBookmark({ url: event.pageUrl })

        try {
            await pending
        } catch (err) {
            toggleBookmarkState(!shouldBeBookmarked)

            throw err
        }
    }

    togglePageTagPicker: EventHandler<'togglePageTagPicker'> = ({
        previousState,
        event,
    }) => {
        const resultIndex = previousState.searchResults.findIndex(
            (result) => result.url === event.pageUrl,
        )
        const currentlyShown = !!previousState.searchResults[resultIndex]
            .shouldDisplayTagPopup
        const shouldBeShown = !currentlyShown

        return {
            searchResults: {
                [resultIndex]: {
                    shouldDisplayTagPopup: { $set: shouldBeShown },
                },
            },
        }
    }

    // TODO: figure out which is the correct state to show annots for a given page
    togglePageAnnotationsView: EventHandler<'togglePageAnnotationsView'> = ({
        previousState,
        event,
    }) => {
        const resultIndex = previousState.searchResults.findIndex(
            (result) => result.url === event.pageUrl,
        )
        // const currentlyShown = !!previousState.searchResults[resultIndex].
        // const shouldBeShown = !currentlyShown

        return {
            // searchResults: {
            //     [resultIndex]: {
            //         shouldDisplayTagPopup: { $set: shouldBeShown }
            //     }
            // }
        }
    }

    // annotationMouseEnter: EventHandler<'annotationMouseEnter'> = incoming => {
    //     return { hoverAnnotationUrl}
    // }

    changeSearchQuery: EventHandler<'changeSearchQuery'> = (incoming) => {
        return {
            searchValue: { $set: incoming.event.searchQuery },
        }
    }

    togglePageType: EventHandler<'togglePageType'> = (incoming) => {
        const currentPageType = incoming.previousState.pageType
        const toggledPageType = currentPageType === 'all' ? 'page' : 'all'
        this.setPageType({ ...incoming, event: { type: toggledPageType } })
    }

    setPageType: EventHandler<'setPageType'> = async ({
        previousState,
        event,
    }) => {
        const mutation = {
            pageType: { $set: event.type },
        }
        this.emitMutation(mutation)
        await this._maybeLoad(previousState, mutation)
    }

    setSearchType: EventHandler<'setSearchType'> = async ({
        previousState,
        event,
    }) => {
        const mutation = {
            searchType: { $set: event.type },
        }
        this.emitMutation(mutation)
        await this._maybeLoad(previousState, mutation)
    }

    setResultsSearchType: EventHandler<'setResultsSearchType'> = (incoming) => {
        this.emitMutation({
            resultsSearchType: { $set: incoming.event.type },
        })
    }

    setAnnotationsExpanded: EventHandler<'setAnnotationsExpanded'> = (
        incoming,
    ) => {}

    clearAllFilters: EventHandler<'clearAllFilters'> = (incoming) => {}

    fetchSuggestedTags: EventHandler<'fetchSuggestedTags'> = (incoming) => {}

    fetchSuggestedDomains: EventHandler<'fetchSuggestedDomains'> = (
        incoming,
    ) => {}

    resetFiterPopups: EventHandler<'resetFiterPopups'> = (incoming) => {}

    toggleShowFilters: EventHandler<'toggleShowFilters'> = (incoming) => {
        return { showFiltersSidebar: { $apply: (show) => !show } }
    }

    toggleAllAnnotationsFold: EventHandler<'toggleAllAnnotationsFold'> = (
        incoming,
    ) => {
        return { allAnnotationsExpanded: { $apply: (value) => !value } }
    }

    annotationMouseEnter: EventHandler<'annotationMouseEnter'> = (incoming) => {
        return {
            hoverAnnotationUrl: {
                [incoming.event.context]: {
                    $set: incoming.event.annnotationUrl,
                },
            },
        }
    }

    annotationMouseLeave: EventHandler<'annotationMouseLeave'> = (incoming) => {
        return {
            hoverAnnotationUrl: { [incoming.event.context]: { $set: '' } },
        }
    }

    async _maybeLoad(
        state: SidebarContainerState,
        changes: UIMutation<SidebarContainerState>,
    ) {
        const nextState = this.withMutation(state, changes)
        if (nextState.searchType === 'notes' && nextState.pageType === 'page') {
            await this._loadAnnotations()
        } else {
            await this._doSearch(nextState)
        }
    }
}

const searchAnnotations = async (search: SearchInterface, query: string) => {
    const result = await search.searchAnnotations({
        query: query.length ? query : undefined,
    })

    const resultsByUrl: ResultsByUrl = new Map()
    result.docs.forEach((doc, index) => {
        resultsByUrl.set(doc.pageId, {
            ...doc,
            index,
        })
    })

    return {
        results: result.docs,
        resultsByUrl,
        annotsByDay: result['annotsByDay'],
    }
}
