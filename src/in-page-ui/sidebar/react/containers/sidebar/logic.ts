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
import { mergeAnnotsByDay, areAnnotsByDayObjsDifferent } from 'src/search/util'
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
    primarySearchState: TaskState
    secondarySearchState: TaskState

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
    showAnnotsForPage?: Page

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
    searchResultSkip: number

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
    goToAnnotation: { context: AnnotationEventContext; annotationUrl: string }
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
        annotationUrl: string
    }
    annotationMouseLeave: {
        context: AnnotationEventContext
        annotationUrl: string
    }

    // Search
    enterSearchQuery: { searchQuery: string }
    changeSearchQuery: { searchQuery: string }
    paginateSearch: null
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
    togglePageAnnotationsView: { pageUrl: string; pageTitle?: string }
    resetPageAnnotationsView: null
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
            primarySearchState: 'pristine',
            secondarySearchState: 'pristine',

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
            showAnnotsForPage: undefined,
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
            searchResultSkip: 0,
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
            if (this.options.env === 'inpage') {
                await this._doSearch(previousState, { overwrite: true })
            }
        })
    }

    private doSearch = debounce(this._doSearch, 300)

    private async _doSearch(
        state: SidebarContainerState,
        opts: { overwrite: boolean },
    ) {
        await executeUITask(
            this,
            opts.overwrite ? 'primarySearchState' : 'secondarySearchState',
            async () => {
                if (state.searchType === 'page') {
                    return this.doPageSearch(state, opts)
                } else if (state.searchType === 'notes') {
                    return this.doAnnotationSearch(state, opts)
                } else {
                    throw new Error('Unknown search type')
                }
            },
        )
    }

    private async doPageSearch(
        state: SidebarContainerState,
        opts: { overwrite: boolean },
    ) {
        const query = state.searchValue.trim().length
            ? state.searchValue.trim()
            : undefined

        const results = (
            await this.options.search.searchPages({
                base64Img: true,
                query,
                contentTypes: {
                    pages: true,
                    notes: true,
                    highlights: true,
                },
                limit: this.options.searchResultLimit,
                skip: state.searchResultSkip,
            })
        ).docs

        this.emitMutation({
            pageCount: { $set: results.length },
            noResults: { $set: results.length === 0 },
            resultsByUrl: {
                $apply: (prev) => {
                    const resultsByUrl = createResultsByUrlObj(results)

                    return opts.overwrite
                        ? resultsByUrl
                        : { ...prev, ...resultsByUrl }
                },
            },
        })
    }

    private async doAnnotationSearch(
        state: SidebarContainerState,
        opts: { overwrite: boolean },
    ) {
        let mutation: UIMutation<SidebarContainerState> = {}

        const query = state.searchValue.trim().length
            ? state.searchValue.trim()
            : undefined
        const url =
            state.pageType === 'page' ? this.options.currentTab.url : undefined

        const results = await this.options.search.searchAnnotations({
            base64Img: true,
            query,
            url,
            limit: this.options.searchResultLimit,
            skip: state.searchResultSkip,
        })

        if (state.pageType === 'page') {
            mutation = this.calcPageAnnotationsSearchMutation(
                results,
                state.annotations,
                {
                    ...opts,
                    isTermsSearch: !!query,
                },
            )
        } else {
            mutation = this.calcAllAnnotationsSearchMutation(
                results,
                state.annotsByDay,
                { ...opts, isTermsSearch: !!query },
            )
        }

        this.emitMutation({
            ...mutation,
            resultsByUrl: {
                $apply: (prev) => {
                    const resultsByUrl = createResultsByUrlObj(results.docs)

                    return opts.overwrite
                        ? resultsByUrl
                        : { ...prev, ...resultsByUrl }
                },
            },
        })
    }

    private calcAllAnnotationsSearchMutation(
        results: StandardSearchResponse | AnnotationsSearchResponse,
        existingAnnotsByDay: PageUrlsByDay,
        opts: {
            isTermsSearch: boolean
            overwrite: boolean
        },
    ): UIMutation<SidebarContainerState> {
        // Terms search doesn't return the same result shape :S
        if (opts.isTermsSearch) {
            return {
                pageCount: { $set: results.docs.length },
                noResults: { $set: !results.docs.length },
            }
        }

        const { annotsByDay } = results as AnnotationsSearchResponse

        // NOTE: search pagination does not seem to be working here, hence why
        //  we're comparing the prev state with the current state to determine
        //  whether we need to fetch more or not... :(
        if (
            opts.overwrite ||
            areAnnotsByDayObjsDifferent(existingAnnotsByDay, annotsByDay)
        ) {
            return {
                annotsByDay: {
                    $apply: (prev) =>
                        opts.overwrite
                            ? annotsByDay
                            : mergeAnnotsByDay(prev, annotsByDay),
                },
                pageCount: { $set: results.docs.length },
                noResults: { $set: results.docs.length === 0 },
            }
        }

        return {
            noResults: { $set: true },
        }
    }

    private calcPageAnnotationsSearchMutation(
        results: StandardSearchResponse | AnnotationsSearchResponse,
        existingAnnotations: Annotation[],
        opts: {
            isTermsSearch: boolean
            overwrite: boolean
        },
    ): UIMutation<SidebarContainerState> {
        const url = this.options.normalizeUrl(this.options.currentTab.url)
        const annotations: Annotation[] = []

        const uniqAnnotsByUrl = (
            a: Annotation[],
            b: Annotation[],
        ): Annotation[] => {
            const urls = new Set(a.map((annot) => annot.url))
            return [...a, ...b.filter((annot) => !urls.has(annot.url))]
        }

        const diffAnnotsByUrl = (
            a: Annotation[],
            b: Annotation[],
        ): Annotation[] => {
            const urlsA = new Set(a.map((annot) => annot.url))
            const urlsB = new Set(b.map((annot) => annot.url))

            return [...a, ...b].filter(
                (annot) => !(urlsA.has(annot.url) && urlsB.has(annot.url)),
            )
        }

        // NOTE: the annots search end point doesn't properly implement the `skip` arg for pagination.
        //  That, coupled with the usage of that cluster of annots indexed by page then by day, leads
        //  to this big mess
        const annotsMutation: UIMutation<SidebarContainerState> = {
            pageCount: {
                $apply: () =>
                    opts.overwrite
                        ? annotations.length
                        : uniqAnnotsByUrl(existingAnnotations, annotations)
                              .length,
            },
            noResults: {
                $apply: () =>
                    diffAnnotsByUrl(existingAnnotations, annotations).length ===
                    0,
            },
            annotations: {
                $apply: (prev) =>
                    opts.overwrite
                        ? annotations
                        : uniqAnnotsByUrl(prev, annotations),
            },
        }

        if (opts.isTermsSearch) {
            for (const doc of results.docs) {
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

            return annotsMutation
        }

        const { annotsByDay } = results as AnnotationsSearchResponse
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
            ...annotsMutation,
            annotsByDay: {
                $apply: (prev) =>
                    opts.overwrite
                        ? annotsByDay
                        : mergeAnnotsByDay(prev, annotsByDay),
            },
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
        const comment = event.commentText.trim()
        const body = event.anchor?.quote

        if (comment.length === 0 && !body?.length) {
            return
        }

        const pageUrl = this.options.currentTab.url
        const dummyAnnotation = {
            pageUrl,
            comment,
            body,
            tags: event.tags,
            hasBookmark: event.bookmarked,
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

    goToAnnotation: EventHandler<'goToAnnotation'> = async ({
        event,
        previousState,
    }) => {
        if (
            previousState.showAnnotsForPage != null &&
            this.options.env !== 'overview'
        ) {
            return
        }

        const { url } = this.options.currentTab
        const normalizedUrl = this.options.normalizeUrl(url)
        let annotation: Annotation
        let pageAnnotations: Annotation[]

        const goToAnnotationInNewTab = (args: {
            url: string
            annotation: Annotation
        }) => this.options.annotations.goToAnnotationFromSidebar(args)

        if (event.context === 'searchResults') {
            const {
                time,
                pageUrl,
                index,
            } = SidebarContainerLogic.findIndexOfAnnotsByDay(
                event.annotationUrl,
                previousState.annotsByDay,
            )

            annotation = previousState.annotsByDay[time][pageUrl][index] as any

            if (pageUrl !== normalizedUrl) {
                return goToAnnotationInNewTab({
                    url: annotation.pageUrl,
                    annotation,
                })
            }

            pageAnnotations = await this.options.annotations.getAllAnnotationsByUrl(
                { url },
            )
        } else {
            pageAnnotations = previousState.annotations
            annotation = pageAnnotations.find(
                (annot) => annot.url === event.annotationUrl,
            )
        }

        if (!annotation?.body?.length) {
            return
        }

        if (this.options.env === 'overview') {
            return goToAnnotationInNewTab({
                url: annotation.pageUrl,
                annotation,
            })
        }

        const highlightables = pageAnnotations.filter((annot) => annot.selector)

        await this.options.highlighter.renderHighlights(
            highlightables,
            this.options.annotations.toggleSidebarOverlay,
        )

        await this.options.highlighter.highlightAndScroll(annotation)
    }

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

    togglePageAnnotationsView: EventHandler<
        'togglePageAnnotationsView'
    > = async ({ event }) => {
        const annotations = await this.options.annotations.getAllAnnotationsByUrl(
            { url: event.pageUrl, limit: 100 },
        )

        this.emitMutation({
            searchType: { $set: 'notes' },
            pageType: { $set: 'page' },
            annotations: { $set: annotations },
            showAnnotsForPage: {
                $set: { url: event.pageUrl, title: event.pageTitle },
            },
        })
    }

    resetPageAnnotationsView: EventHandler<
        'resetPageAnnotationsView'
    > = async ({ event }) => {
        this.emitMutation({
            searchType: { $set: 'page' },
            showAnnotsForPage: { $set: undefined },
        })
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
                searchResultSkip: { $set: 0 },
            }),
            { overwrite: true },
        )
    }

    changeSearchQuery: EventHandler<'changeSearchQuery'> = async ({
        event,
        previousState,
    }) => {
        const mutation: UIMutation<SidebarContainerState> = {
            searchValue: { $set: event.searchQuery },
            searchResultSkip: { $set: 0 },
        }
        this.emitMutation(mutation)
        const nextState = this.withMutation(previousState, mutation)

        if (nextState.searchValue.trim() !== previousState.searchValue.trim()) {
            await this.doSearch(nextState, { overwrite: true })
        }
    }

    paginateSearch: EventHandler<'paginateSearch'> = async ({
        previousState,
    }) => {
        if (previousState.noResults) {
            return
        }

        const mutation: UIMutation<SidebarContainerState> = {
            searchResultSkip: {
                $apply: (prev) => prev + this.options.searchResultLimit,
            },
        }
        this.emitMutation(mutation)
        const nextState = this.withMutation(previousState, mutation)

        await this.doSearch(nextState, { overwrite: false })
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
        const mutation: UIMutation<SidebarContainerState> = {
            searchResultSkip: { $set: 0 },
            showAnnotsForPage: { $set: undefined },
        }

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
        await this._doSearch(this.withMutation(previousState, mutation), {
            overwrite: true,
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
                    $set: incoming.event.annotationUrl,
                },
            },
        }
    }

    annotationMouseLeave: EventHandler<'annotationMouseLeave'> = (incoming) => {
        return {
            hoverAnnotationUrl: { [incoming.event.context]: { $set: '' } },
        }
    }
}

const createResultsByUrlObj = (results): ResultsByUrl => {
    const obj: ResultsByUrl = {}

    results.forEach((result, index) => {
        obj[result.url] = { ...result, index }
    })

    return obj
}
