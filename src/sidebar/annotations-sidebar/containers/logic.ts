import debounce from 'lodash/debounce'
import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'
import { EventEmitter } from 'events'

import { Annotation } from 'src/annotations/types'
import { Anchor } from 'src/highlighting/types'
import { loadInitial, executeUITask } from 'src/util/ui-logic'
import { SidebarContainerDependencies } from './types'
import { AnnotationsSidebarInPageEventEmitter } from '../types'
import { featuresBeta } from 'src/util/remote-functions-background'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import { DEF_RESULT_LIMIT } from '../constants'

export interface SidebarContainerState {
    loadState: TaskState
    primarySearchState: TaskState
    secondarySearchState: TaskState

    showState: 'visible' | 'hidden'

    pageUrl?: string
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
        anchor: Anchor | null
        form: {
            isBookmarked: boolean
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
    setNewPageCommentTagPicker: { active: boolean }

    updateTagsForNewComment: { added?: string; deleted?: string }
    // updateTagsForResult: { added: string; deleted: string; url: string }
    updateListsForPageResult: { added?: string; deleted?: string; url: string }
    addNewPageCommentTag: { tag: string }
    deleteNewPageCommentTag: { tag: string }
    // closeComments: null,

    // Annotation boxes
    goToAnnotation: {
        context: AnnotationEventContext
        annotationUrl: string
    }
    setActiveAnnotationUrl: string
    setAnnotationEditMode: {
        context: AnnotationEventContext
        annotationUrl: string
    }
    editAnnotation: {
        context: AnnotationEventContext
        annotationUrl: string
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

    setPageUrl: { pageUrl: string }

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
    events?: AnnotationsSidebarInPageEventEmitter
}

type EventHandler<
    EventName extends keyof SidebarContainerEvents
> = UIEventHandler<SidebarContainerState, SidebarContainerEvents, EventName>

const INITIAL_COMMENT_BOX_STATE: SidebarContainerState['commentBox'] = {
    anchor: null,
    form: {
        isBookmarked: false,
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
    private inPageEvents: AnnotationsSidebarInPageEventEmitter

    constructor(private options: SidebarContainerOptions) {
        super()

        this.inPageEvents =
            options.events ??
            (new EventEmitter() as AnnotationsSidebarInPageEventEmitter)
    }

    private get resultLimit(): number {
        return this.options.searchResultLimit ?? DEF_RESULT_LIMIT
    }

    getInitialState(): SidebarContainerState {
        return {
            loadState: 'pristine',
            primarySearchState: 'pristine',
            secondarySearchState: 'pristine',

            pageUrl: this.options.pageUrl,
            showState: this.options.initialState ?? 'hidden',
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

    init: EventHandler<'init'> = async ({ previousState }) => {
        await loadInitial<SidebarContainerState>(this, async () => {
            // If `pageUrl` prop passed down, load search results on init, else just wait
            if (this.options.pageUrl != null) {
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
        this.emitMutation({ showState: { $set: 'visible' } })

        // TODO: (sidebar-refactor) show shouldn't have conditional side effects
        // figure out when this is needed and do it from higher up
        // or this may go away when storing the annotations higher up in the shared state class
        //
        // if (this.options.env === 'inpage') {
        //     await this._doSearch(this.getInitialState(), { overwrite: true })
        // }
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
        const annotations = await this.options.annotations.getAllAnnotationsByUrl(
            {
                base64Img: true,
                url: state.pageUrl,
                skip: state.searchResultSkip,
                limit: this.resultLimit,
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
                $apply: (prev) => prev + this.resultLimit,
            },
        }
        this.emitMutation(mutation)
        const nextState = this.withMutation(previousState, mutation)

        await this.doSearch(nextState, { overwrite: false })
    }

    setPageUrl: EventHandler<'setPageUrl'> = ({ previousState, event }) => {
        const mutation: UIMutation<SidebarContainerState> = {
            pageUrl: { $set: event.pageUrl },
        }
        this.emitMutation(mutation)
        const nextState = this.withMutation(previousState, mutation)

        return this._doSearch(nextState, { overwrite: true })
    }

    hide: EventHandler<'hide'> = () => {
        this.emitMutation({
            showState: { $set: 'hidden' },
            activeAnnotationUrl: { $set: null },
        })
    }

    addNewPageComment: EventHandler<'addNewPageComment'> = async () => {
        this.emitMutation({ showCommentBox: { $set: true } })
    }

    setNewPageCommentAnchor: EventHandler<'setNewPageCommentAnchor'> = (
        incoming,
    ) => {
        this.emitMutation({
            commentBox: { anchor: { $set: incoming.event.anchor } },
        })
    }

    changePageCommentText: EventHandler<'changePageCommentText'> = (
        incoming,
    ) => {
        this.emitMutation({
            commentBox: {
                form: { commentText: { $set: incoming.event.comment } },
            },
        })
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

        const pageUrl = previousState.pageUrl

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
            // TODO: (sidebar - refactor) Fix env usage
            const annotationUrl = await this.options.annotations.createAnnotation(
                {
                    url: pageUrl,
                    bookmarked: event.bookmarked,
                    body: dummyAnnotation.body,
                    comment: dummyAnnotation.comment,
                    selector: dummyAnnotation.selector,
                },
                // { skipPageIndexing: this.options.env === 'overview' },
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

            this.inPageEvents.emit('removeTemporaryHighlights')
            this.inPageEvents.emit('renderHighlight', {
                highlight: { ...dummyAnnotation, url: annotationUrl },
            })
        } catch (err) {
            updateState({ annotations: previousState.annotations })
            throw err
        }
    }

    cancelNewPageComment: EventHandler<'cancelNewPageComment'> = () => {
        this.inPageEvents.emit('removeTemporaryHighlights')
        this.emitMutation({
            commentBox: { $set: INITIAL_COMMENT_BOX_STATE },
            showCommentBox: { $set: false },
        })
    }

    toggleNewPageCommentBookmark: EventHandler<
        'toggleNewPageCommentBookmark'
    > = () => {
        this.emitMutation({
            commentBox: {
                form: {
                    isBookmarked: {
                        $apply: (bookmarked) => !bookmarked,
                    },
                },
            },
        })
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
        this.emitMutation({
            commentBox: {
                form: {
                    isTagInputActive: { $apply: (active) => !active },
                },
            },
        })
    }

    setNewPageCommentTagPicker: EventHandler<'setNewPageCommentTagPicker'> = ({
        event,
    }) => {
        this.emitMutation({
            commentBox: {
                form: {
                    isTagInputActive: { $set: event.active },
                },
            },
        })
    }

    addNewPageCommentTag: EventHandler<'addNewPageCommentTag'> = (incoming) => {
        this.emitMutation({
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
        })
    }

    deleteNewPageCommentTag: EventHandler<'deleteNewPageCommentTag'> = (
        incoming,
    ) => {
        this.emitMutation({
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
        })
    }

    setActiveAnnotationUrl = async ({ event }) =>
        this.emitMutation({ activeAnnotationUrl: { $set: event } })

    goToAnnotation: EventHandler<'goToAnnotation'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            activeAnnotationUrl: { $set: event.annotationUrl },
        })

        const annotation = previousState.annotations.find(
            (annot) => annot.url === event.annotationUrl,
        )

        if (!annotation?.body?.length) {
            return
        }

        // TODO: (sidebar - refactor) Fix env usage
        // if (this.options.env === 'overview') {
        //     return this.options.annotations.goToAnnotationFromSidebar({
        //         url: annotation.pageUrl,
        //         annotation,
        //     })
        // }

        this.inPageEvents.emit('highlightAndScroll', {
            url: event.annotationUrl,
        })
    }

    editAnnotation: EventHandler<'editAnnotation'> = async ({
        event,
        previousState,
    }) => {
        const {
            commentBox: { form },
        } = previousState
        const resultIndex = previousState.annotations.findIndex(
            (annot) => annot.url === event.annotationUrl,
        )
        const comment = form.commentText.trim()

        this.emitMutation({
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            },
            annotations: {
                [resultIndex]: {
                    tags: { $set: form.tags },
                    comment: { $set: comment },
                    lastEdited: { $set: Date.now() },
                },
            },
            commentBox: {
                $set: { ...INITIAL_COMMENT_BOX_STATE },
            },
        })

        try {
            await this.options.annotations.editAnnotation(
                event.annotationUrl,
                comment,
            )
            await this.options.annotations.updateAnnotationTags({
                url: event.annotationUrl,
                tags: form.tags,
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

    setAnnotationEditMode: EventHandler<'setAnnotationEditMode'> = ({
        event,
        previousState,
    }) => {
        const annotation = previousState.annotations.find(
            (annot) => annot.url === event.annotationUrl,
        )

        this.emitMutation({
            commentBox: {
                form: {
                    commentText: { $set: annotation.comment ?? '' },
                    tags: { $set: annotation.tags ?? [] },
                    isBookmarked: { $set: !!annotation.hasBookmark },
                },
            },
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: { $set: 'edit' },
                },
            },
        })
    }

    switchAnnotationMode: EventHandler<'switchAnnotationMode'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: {
                        $set: event.mode,
                    },
                },
            },
        })
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
