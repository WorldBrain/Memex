import debounce from 'lodash/debounce'
import {
    UILogic,
    UIEvent,
    IncomingUIEvent,
    UIEventHandler,
    UIMutation,
} from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'
import {
    SidebarEnv,
    Page,
    AnnotationMode,
    ResultWithIndex as Result,
    ResultsByUrl,
} from '../../types'
import { Annotation } from 'src/annotations/types'
import {
    PageUrlsByDay,
    StandardSearchResponse,
    AnnotationsSearchResponse,
} from 'src/search/background/types'
import { Anchor } from 'src/highlighting/types'
import { loadInitial, executeUITask } from 'src/util/ui-logic'
import {
    SidebarContainerDependencies,
    PageType,
    SearchType,
    SearchTypeChange,
} from './types'

export interface SidebarContainerState {
    loadState: TaskState
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
            commentText: string
            tags: string[]
        }
    }

    deletePageModal: {
        pageUrlToDelete?: string
        // isDeletePageModalShown: boolean
    }

    searchValue: string
    pageType: PageType
    searchType: SearchType
    resultsSearchType: SearchType
    pageCount?: number
    noResults: boolean
    isBadTerm: boolean
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
        skipPageIndexing?: boolean
    }
    cancelNewPageComment: null
    toggleNewPageCommentBookmark: null
    togglePageCommentTags: null
    toggleNewPageCommentTagPicker: null

    updateTagsForNewComment: { added: string; deleted: string }
    updateTagsForResult: { added: string; deleted: string; url: string }
    updateListsForPageResult: { added: string; deleted: string; url: string }
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
        annotationUrl: string
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
    enterSearchQuery: { searchQuery: string }
    changeSearchQuery: { searchQuery: string }
    togglePageType: null
    switchSearch: { changes: SearchTypeChange }
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
    togglePageListPicker: { pageUrl: string }
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
        commentText: '',
        tags: [],
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
            resultsByUrl: {},
            resultsClusteredByDay: false,
            annotsByDay: {},
            isSocialSearch: false,
        }
    }

    private static findIndexOfAnnotsByDay(
        annotationUrl: string,
        annotsByDay: PageUrlsByDay,
    ): { time: number; pageUrl: string; index: number } {
        for (const [time, annotsByPageObj] of Object.entries(annotsByDay)) {
            for (const [pageUrl, annotations] of Object.entries(
                annotsByPageObj as { [pageUrl: string]: Annotation[] },
            )) {
                const index = annotations.findIndex(
                    (annot) => annot.url === annotationUrl,
                )
                if (index === -1) {
                    continue
                }
                return { time, pageUrl, index } as any
            }
        }
    }
    init: EventHandler<'init'> = async ({ previousState }) => {
        await loadInitial<SidebarContainerState>(this, async () => {
            await this._maybeLoad(previousState, {})
        })
    }

    private doSearch = debounce(this._doSearch, 300)

    private async _doSearch(state: SidebarContainerState) {
        const { search, currentTab } = this.options
        const query = state.searchValue.length ? state.searchValue : undefined
        const url = state.pageType === 'page' ? currentTab.url : undefined

        await executeUITask(this, 'searchLoadState', async () => {
            if (state.searchType === 'page') {
                const results = (
                    await search.searchPages({
                        base64Img: true,
                        query,
                        contentTypes: {
                            pages: true,
                            notes: true,
                            highlights: true,
                        },
                    })
                ).docs

                this.emitMutation({
                    resultsByUrl: { $set: createResultsByUrlObj(results) },
                    pageCount: { $set: results.length },
                    noResults: { $set: !results.length },
                })
            } else if (state.searchType === 'notes') {
                const result = await search.searchAnnotations({
                    base64Img: true,
                    query,
                    url,
                })

                const extraMutation =
                    state.pageType === 'page'
                        ? this.calcPageAnnotationsMutation(result, !!query)
                        : {}

                this.emitMutation({
                    pageCount: { $set: result.docs.length },
                    noResults: { $set: !result.docs.length },
                    resultsByUrl: { $set: createResultsByUrlObj(result.docs) },
                    ...extraMutation,
                })
            }
        })
    }

    private calcPageAnnotationsMutation(
        result: StandardSearchResponse | AnnotationsSearchResponse,
        isTermsSearch: boolean,
    ): UIMutation<SidebarContainerState> {
        const url = this.options.normalizeUrl(this.options.currentTab.url)
        const annotations: Annotation[] = []

        if (isTermsSearch) {
            for (const doc of result.docs) {
                if (doc.url === url) {
                    annotations.push(
                        ...doc.annotations.map((annot) => ({
                            ...annot,
                            createdWhen: annot.createdWhen?.valueOf(),
                            lastEdited: annot.lastEdited?.valueOf(),
                        })),
                    )
                }
            }

            return { annotations: { $set: annotations } }
        }

        const { annotsByDay } = result as AnnotationsSearchResponse
        const sortedKeys = Object.keys(annotsByDay).sort().reverse()

        for (const day of sortedKeys) {
            const cluster = annotsByDay[day]

            for (const pageUrl of Object.keys(cluster)) {
                if (pageUrl === url) {
                    annotations.push(...cluster[pageUrl])
                }
            }
        }

        return {
            annotations: { $set: annotations },
            annotsByDay: { $set: annotsByDay },
        }
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
            hasBookmark: event.bookmarked,
            comment: event.commentText,
            body: event.anchor?.quote,
            selector: event.anchor,
            createdWhen: Date.now(),
            lastEdited: Date.now(),
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
            annotations: [dummyAnnotation, ...previousState.annotations],
        })

        try {
            const annotationUrl = await this.options.annotations.createAnnotation(
                {
                    url: pageUrl,
                    bookmarked: event.bookmarked,
                    body: dummyAnnotation.body,
                    comment: dummyAnnotation.comment,
                    selector: dummyAnnotation.selector,
                },
                { skipPageIndexing: event.skipPageIndexing },
            )

            this.emitMutation({
                annotations: {
                    [0]: {
                        url: { $set: annotationUrl },
                    },
                },
            })

            for (const tag of event.tags) {
                await this.options.annotations.addAnnotationTag({
                    tag,
                    url: annotationUrl,
                })
            }
        } catch (err) {
            updateState({ annotations: previousState.annotations })
            throw err
        }
    }

    cancelNewPageComment: EventHandler<'cancelNewPageComment'> = () => {
        this.options.highlighter.removeTempHighlights()
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

    updateTagsForNewComment: EventHandler<'updateTagsForNewComment'> = async ({
        event,
    }) => {
        let tagsStateUpdater: (tags: string[]) => string[]

        if (event.added) {
            tagsStateUpdater = (tags) => {
                const tag = event.added
                return tags.includes(tag) ? tags : [...tags, tag]
            }
        }

        if (event.deleted) {
            tagsStateUpdater = (tags) => {
                const index = tags.indexOf(event.deleted)
                if (index === -1) {
                    return tags
                }

                return [...tags.slice(0, index), ...tags.slice(index + 1)]
            }
        }
        this.emitMutation({
            commentBox: { form: { tags: { $apply: tagsStateUpdater } } },
        })
    }

    updateTagsForResult: EventHandler<'updateTagsForResult'> = async ({
        event,
    }) => {
        const backendResult = this.options.tags.updateTagForPage({
            added: event.added,
            deleted: event.deleted,
            url: event.url,
        })

        let tagsStateUpdater: (tags: string[]) => string[]

        if (event.added) {
            tagsStateUpdater = (tags) => {
                const tag = event.added
                return tags.includes(tag) ? tags : [...tags, tag]
            }
        }

        if (event.deleted) {
            tagsStateUpdater = (tags) => {
                const index = tags.indexOf(event.deleted)
                if (index === -1) {
                    return tags
                }

                return [...tags.slice(0, index), ...tags.slice(index + 1)]
            }
        }
        this.emitMutation({
            resultsByUrl: {
                [event.url]: {
                    tags: { $apply: tagsStateUpdater },
                },
            },
        })

        return backendResult
    }

    updateListsForPageResult: EventHandler<
        'updateListsForPageResult'
    > = async ({ event }) => {
        return this.options.customLists.updateListForPage({
            added: event.added,
            deleted: event.deleted,
            url: event.url,
        })
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
        let mutation: any
        let resetMutation: any

        if (event.context === 'searchResults') {
            const {
                time,
                pageUrl,
                index,
            } = SidebarContainerLogic.findIndexOfAnnotsByDay(
                event.annotationUrl,
                previousState.annotsByDay,
            )

            mutation = {
                annotsByDay: {
                    [time]: {
                        [pageUrl]: {
                            [index]: {
                                tags: { $set: event.tags },
                                comment: { $set: event.comment },
                                lastEdited: { $set: Date.now() },
                            },
                        },
                    },
                },
            }

            resetMutation = { annotsByDay: { $set: previousState.annotsByDay } }
        } else {
            const resultIndex = previousState.annotations.findIndex(
                (annot) => annot.url === event.annotationUrl,
            )
            mutation = {
                annotations: {
                    [resultIndex]: {
                        tags: { $set: event.tags },
                        comment: { $set: event.comment },
                        lastEdited: { $set: Date.now() },
                    },
                },
            }

            resetMutation = { annotations: { $set: previousState.annotations } }
        }

        this.emitMutation({
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            },
            ...mutation,
        })

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
            this.emitMutation(resetMutation)
            throw err
        }
    }

    deleteAnnotation: EventHandler<'deleteAnnotation'> = async ({
        event,
        previousState,
    }) => {
        let mutation: any
        let resetMutation: any

        if (event.context === 'searchResults') {
            const {
                time,
                pageUrl,
                index,
            } = SidebarContainerLogic.findIndexOfAnnotsByDay(
                event.annotationUrl,
                previousState.annotsByDay,
            )

            // If only one annot left for the page, remove the page
            if (previousState.annotsByDay[time]?.[pageUrl]?.length === 1) {
                mutation = {
                    annotsByDay: {
                        [time]: {
                            $unset: [pageUrl],
                        },
                    },
                }
            } else {
                mutation = {
                    annotsByDay: {
                        [time]: {
                            [pageUrl]: {
                                $unset: [index],
                            },
                        },
                    },
                }
            }

            resetMutation = { annotsByDay: { $set: previousState.annotsByDay } }
        } else {
            const resultIndex = previousState.annotations.findIndex(
                (annot) => annot.url === event.annotationUrl,
            )
            mutation = {
                annotations: {
                    $apply: (annotations) => [
                        ...annotations.slice(0, resultIndex),
                        ...annotations.slice(resultIndex + 1),
                    ],
                },
            }
            resetMutation = { annotations: { $set: previousState.annotations } }
        }

        this.emitMutation({
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            },
            ...mutation,
        })

        try {
            await this.options.annotations.deleteAnnotation(event.annotationUrl)
        } catch (err) {
            this.emitMutation(resetMutation)
            throw err
        }
    }

    toggleAnnotationBookmark: EventHandler<
        'toggleAnnotationBookmark'
    > = async ({ previousState, event }) => {
        let updateState: (hasBookmark: boolean) => void
        let currentlyBookmarked: boolean

        if (event.context === 'searchResults') {
            const {
                time,
                pageUrl,
                index,
            } = SidebarContainerLogic.findIndexOfAnnotsByDay(
                event.annotationUrl,
                previousState.annotsByDay,
            )

            currentlyBookmarked = !!previousState.annotsByDay[time]?.[
                pageUrl
            ]?.[index]?.hasBookmark

            updateState = (hasBookmark) =>
                this.emitMutation({
                    annotsByDay: {
                        [time]: {
                            [pageUrl]: {
                                [index]: {
                                    hasBookmark: { $set: hasBookmark },
                                },
                            },
                        },
                    },
                })
        } else {
            const resultIndex = previousState.annotations.findIndex(
                (annotation) => annotation.url === event.annotationUrl,
            )

            currentlyBookmarked = !!previousState.annotations[resultIndex]
                ?.hasBookmark

            updateState = (hasBookmark) =>
                this.emitMutation({
                    annotations: {
                        [resultIndex]: {
                            hasBookmark: { $set: hasBookmark },
                        },
                    },
                })
        }

        const shouldBeBookmarked = !currentlyBookmarked
        updateState(shouldBeBookmarked)

        try {
            await this.options.annotations.toggleAnnotBookmark({
                url: event.annotationUrl,
            })
        } catch (err) {
            updateState(!shouldBeBookmarked)

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

        this.emitMutation({
            resultsByUrl: {
                $unset: [pageUrlToDelete],
            },
            deletePageModal: {
                $unset: ['pageUrlToDelete'],
            },
        })

        try {
            await this.options.search.delPages([pageUrlToDelete])
        } catch (err) {
            this.emitMutation({
                resultsByUrl: { $set: previousState.resultsByUrl },
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
                resultsByUrl: {
                    [event.pageUrl]: {
                        hasBookmark: { $set: hasBookmark },
                    },
                },
            })

        const currentlyBookmarked = !!previousState.resultsByUrl[event.pageUrl]
            ?.hasBookmark
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
        const currentlyShown = !!previousState.resultsByUrl[event.pageUrl]
            ?.shouldDisplayTagPopup
        const shouldBeShown = !currentlyShown

        return {
            resultsByUrl: {
                [event.pageUrl]: {
                    shouldDisplayTagPopup: { $set: shouldBeShown },
                },
            },
        }
    }

    togglePageListPicker: EventHandler<'togglePageListPicker'> = ({
        previousState,
        event,
    }) => {
        const currentlyShown = !!previousState.resultsByUrl[event.pageUrl]
            ?.shouldDisplayListPopup
        const shouldBeShown = !currentlyShown

        return {
            resultsByUrl: {
                [event.pageUrl]: {
                    shouldDisplayListPopup: { $set: shouldBeShown },
                },
            },
        }
    }

    // TODO: figure out which is the correct state to show annots for a given page
    togglePageAnnotationsView: EventHandler<'togglePageAnnotationsView'> = ({
        previousState,
        event,
    }) => {
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

    enterSearchQuery: EventHandler<'enterSearchQuery'> = async ({
        event,
        previousState,
    }) => {
        await this.doSearch(
            this.withMutation(previousState, {
                searchValue: { $set: event.searchQuery },
            }),
        )
    }

    changeSearchQuery: EventHandler<'changeSearchQuery'> = async ({
        event,
        previousState,
    }) => {
        const mutation = { searchValue: { $set: event.searchQuery } }
        this.emitMutation(mutation)

        await this.doSearch(this.withMutation(previousState, mutation))
    }

    togglePageType: EventHandler<'togglePageType'> = async (incoming) => {
        const currentPageType = incoming.previousState.pageType
        const toggledPageType = currentPageType === 'all' ? 'page' : 'all'
        await this.switchSearch({
            ...incoming,
            event: { changes: { pageType: toggledPageType } },
        })
    }

    switchSearch: EventHandler<'switchSearch'> = async ({
        previousState,
        event,
    }) => {
        const mutation: UIMutation<SidebarContainerState> = {}
        if (event.changes.pageType) {
            mutation.pageType = { $set: event.changes.pageType }
        }
        if (event.changes.searchType) {
            mutation.searchType = { $set: event.changes.searchType }
        }
        if (event.changes.resultsSearchType) {
            mutation.resultsSearchType = {
                $set: event.changes.resultsSearchType,
            }
        }
        this.emitMutation(mutation)
        await this._maybeLoad(previousState, mutation)
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
        await this._doSearch(nextState)
        // if (nextState.searchType === 'notes' && nextState.pageType === 'page') {
        //     await this._loadAnnotations()
        // } else {
        //     await this._doSearch(nextState)
        // }
    }
}

const createResultsByUrlObj = (results): ResultsByUrl => {
    const obj: ResultsByUrl = {}

    results.forEach((result, index) => {
        obj[result.url] = { ...result, index }
    })

    return obj
}
