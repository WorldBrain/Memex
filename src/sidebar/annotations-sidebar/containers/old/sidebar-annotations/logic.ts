import debounce from 'lodash/debounce'
import {
    UILogic,
    UIEvent,
    IncomingUIEvent,
    UIEventHandler,
    UIMutation,
} from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'

import { Annotation } from 'src/annotations/types'
import { PageUrlsByDay } from 'src/search/background/types'
import { Anchor } from 'src/highlighting/types'
import { loadInitial, executeUITask } from 'src/util/ui-logic'
import { SidebarContainerDependencies } from './types'
import { featuresBeta } from 'src/util/remote-functions-background'
import {
    AnnotationMode,
    Page,
    ResultsByUrl,
    SidebarEnv,
} from 'src/sidebar/annotations-sidebar/types'

export interface SidebarContainerState {
    loadState: TaskState
    primarySearchState: TaskState
    secondarySearchState: TaskState

    state: 'visible' | 'hidden'

    annotations: Annotation[]
    annotationModes: {
        [context in AnnotationEventContext]: {
            [annotationUrl: string]: AnnotationMode
        }
    }
    activeAnnotationUrl: string | null
    hoverAnnotationUrl: string | null

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

    // deletePageConfirm: {
    //     pageUrlToDelete?: string
    //     // isDeletePageModalShown: boolean
    // }

    // searchValue: string
    // pageType: PageType
    // searchType: SearchType
    // resultsSearchType: SearchType
    pageCount: number
    noResults: boolean
    // isBadTerm: boolean
    // resultsByUrl: ResultsByUrl
    // resultsClusteredByDay: boolean
    // annotsByDay: PageUrlsByDay

    // Everything below here is temporary

    showCongratsMessage: boolean
    showClearFiltersBtn: boolean
    isSocialPost: boolean
    showAnnotsForPage?: Page
    isBetaEnabled: boolean

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
        anchor?: Anchor
        commentText: string
        tags: string[]
        bookmarked: boolean
    }
    cancelNewPageComment: null
    toggleNewPageCommentBookmark: null
    togglePageCommentTags: null
    toggleNewPageCommentTagPicker: null

    updateTagsForNewComment: { added: string; deleted: string }
    // updateTagsForResult: { added: string; deleted: string; url: string }
    updateListsForPageResult: { added: string; deleted: string; url: string }
    addNewPageCommentTag: { tag: string }
    deleteNewPageCommentTag: { tag: string }
    // closeComments: null,

    // Annotation boxes
    goToAnnotationInPage: {
        context: AnnotationEventContext
        annotationUrl: string
    }
    goToAnnotationInSidebar: {
        context: AnnotationEventContext
        annotationUrl: string
    }
    setActiveAnnotationUrl: string
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
        annotationUrl: string
    }
    annotationMouseLeave: {
        annotationUrl: string
    }

    // Search
    // enterSearchQuery: { searchQuery: string }
    // changeSearchQuery: { searchQuery: string }
    // togglePageType: null
    // switchSearch: { changes: SearchTypeChange }
    // clearAllFilters: null
    // resetFilterPopups: null
    // toggleShowFilters: null

    paginateSearch: null
    setAnnotationsExpanded: { value: boolean }
    toggleAllAnnotationsFold: null
    fetchSuggestedTags: null
    fetchSuggestedDomains: null

    // Page search result interactions
    // togglePageBookmark: { pageUrl: string }
    // togglePageTagPicker: { pageUrl: string }
    // togglePageListPicker: { pageUrl: string }
    // togglePageAnnotationsView: { pageUrl: string; pageTitle?: string }
    // resetPageAnnotationsView: null
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
> {
    constructor(private options: SidebarContainerOptions) {
        super()
    }

    getInitialState(): SidebarContainerState {
        return {
            loadState: 'pristine',
            primarySearchState: 'pristine',
            secondarySearchState: 'pristine',

            state: this.options.inPageUI.componentsShown.sidebar
                ? 'visible'
                : 'hidden',
            annotationModes: {
                pageAnnotations: {},
                searchResults: {},
            },

            commentBox: { ...INITIAL_COMMENT_BOX_STATE },
            // deletePageConfirm: {
            //     pageUrlToDelete: undefined,
            //     // isDeletePageModalShown: false,
            // },

            // pageType: 'all',
            // pageType: 'page',
            // searchType: 'notes',
            // searchType: 'page',
            // resultsSearchType: 'page',

            allAnnotationsExpanded: false,
            isSocialPost: false,
            annotations: [],
            activeAnnotationUrl: null,
            hoverAnnotationUrl: null,

            showCommentBox: false,
            showCongratsMessage: false,
            showClearFiltersBtn: false,
            showAnnotsForPage: undefined,
            showFiltersSidebar: false,
            showSocialSearch: false,

            // searchValue: '',
            pageCount: 0,
            noResults: false,
            // isBadTerm: false,
            // resultsByUrl: {},
            // resultsClusteredByDay: false,
            // annotsByDay: {},

            annotCount: 0,
            shouldShowCount: false,
            isInvalidSearch: false,
            totalResultCount: 0,
            isListFilterActive: false,
            isSocialSearch: false,
            searchResultSkip: 0,

            isBetaEnabled: false,
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
            // await this.loadBeta()
        })
    }

    private async loadBeta() {
        // Check if user is allowed for beta too
        const copyPasterEnabled = await featuresBeta.getFeatureState(
            'copy-paster',
        )
        this.emitMutation({ isBetaEnabled: { $set: copyPasterEnabled } })
    }

    show: EventHandler<'show'> = async () => {
        this.emitMutation({ state: { $set: 'visible' } })

        if (this.options.env === 'inpage') {
            await this._doSearch(this.getInitialState(), { overwrite: true })
        }
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
                return this.doAnnotationSearch(state, opts)
            },
        )
    }

    private async doAnnotationSearch(
        state: SidebarContainerState,
        opts: { overwrite: boolean },
    ) {
        const url = this.options.currentTab.url

        const annotations = await this.options.annotations.getAllAnnotationsByUrl(
            {
                base64Img: true,
                query: '',
                url,
                limit: this.options.searchResultLimit,
                skip: state.searchResultSkip,
            },
        )

        this.emitMutation({
            annotations: { $set: annotations },
            pageCount: { $set: annotations.length },
            noResults: { $set: annotations.length === 0 },
        })
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

    hide: EventHandler<'hide'> = () => {
        return {
            state: { $set: 'hidden' },
            activeAnnotationUrl: { $set: null },
        }
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

        const pageUrl =
            this.options.env === 'overview'
                ? previousState.showAnnotsForPage?.url
                : this.options.currentTab.url

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
                    title: previousState.showAnnotsForPage?.title,
                    body: dummyAnnotation.body,
                    comment: dummyAnnotation.comment,
                    selector: dummyAnnotation.selector,
                },
                { skipPageIndexing: this.options.env === 'overview' },
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

            // No need to attempt to render annots that don't have a highlight
            if (!dummyAnnotation.body?.length) {
                return
            }

            this.options.highlighter.removeTempHighlights()
            await this.options.highlighter.renderHighlight(
                { ...dummyAnnotation, url: annotationUrl },
                () => {
                    this.options.inPageUI.showSidebar(
                        annotationUrl && {
                            anchor: dummyAnnotation.selector,
                            annotationUrl,
                            action: 'show_annotation',
                        },
                    )
                },
            )
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

    setActiveAnnotationUrl = async ({ event }) =>
        this.emitMutation({ activeAnnotationUrl: { $set: event } })

    goToAnnotationInPage: EventHandler<'goToAnnotationInPage'> = async ({
        event,
        previousState,
    }) => {
        if (
            previousState.showAnnotsForPage != null &&
            this.options.env !== 'overview'
        ) {
            return
        }

        this.emitMutation({
            activeAnnotationUrl: { $set: event.annotationUrl },
        })

        const annotation = previousState.annotations.find(
            (annot) => annot.url === event.annotationUrl,
        )

        if (!annotation?.body?.length) {
            return
        }

        if (this.options.env === 'overview') {
            return this.options.annotations.goToAnnotationFromSidebar({
                url: annotation.pageUrl,
                annotation,
            })
        }

        this.options.highlighter.highlightAndScroll({
            url: event.annotationUrl,
        } as any)
    }

    editAnnotation: EventHandler<'editAnnotation'> = async ({
        event,
        previousState,
    }) => {
        const resultIndex = previousState.annotations.findIndex(
            (annot) => annot.url === event.annotationUrl,
        )

        this.emitMutation({
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            },
            annotations: {
                [resultIndex]: {
                    tags: { $set: event.tags },
                    comment: { $set: event.comment },
                    lastEdited: { $set: Date.now() },
                },
            },
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
            this.emitMutation({
                annotations: { $set: previousState.annotations },
            })
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

        this.emitMutation({
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            },
            annotations: {
                $apply: (annotations) => [
                    ...annotations.slice(0, resultIndex),
                    ...annotations.slice(resultIndex + 1),
                ],
            },
        })

        try {
            await this.options.annotations.deleteAnnotation(event.annotationUrl)
        } catch (err) {
            this.emitMutation({
                annotations: { $set: previousState.annotations },
            })
            throw err
        }
    }

    toggleAnnotationBookmark: EventHandler<
        'toggleAnnotationBookmark'
    > = async ({ previousState, event }) => {
        const resultIndex = previousState.annotations.findIndex(
            (annotation) => annotation.url === event.annotationUrl,
        )

        const currentlyBookmarked = !!previousState.annotations[resultIndex]
            ?.hasBookmark

        const updateState = (hasBookmark) =>
            this.emitMutation({
                annotations: {
                    [resultIndex]: {
                        hasBookmark: { $set: hasBookmark },
                    },
                },
            })

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

    setAnnotationsExpanded: EventHandler<'setAnnotationsExpanded'> = (
        incoming,
    ) => {}

    fetchSuggestedTags: EventHandler<'fetchSuggestedTags'> = (incoming) => {}

    fetchSuggestedDomains: EventHandler<'fetchSuggestedDomains'> = (
        incoming,
    ) => {}

    toggleAllAnnotationsFold: EventHandler<'toggleAllAnnotationsFold'> = (
        incoming,
    ) => {
        return { allAnnotationsExpanded: { $apply: (value) => !value } }
    }

    annotationMouseEnter: EventHandler<'annotationMouseEnter'> = (incoming) => {
        return {
            hoverAnnotationUrl: {
                $set: incoming.event.annotationUrl,
            },
        }
    }

    annotationMouseLeave: EventHandler<'annotationMouseLeave'> = (incoming) => {
        return {
            hoverAnnotationUrl: { $set: null },
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
