import debounce from 'lodash/debounce'
import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'
import { EventEmitter } from 'events'

import { Annotation } from 'src/annotations/types'
import { Anchor } from 'src/highlighting/types'
import { loadInitial, executeUITask } from 'src/util/ui-logic'
import { SidebarContainerDependencies } from './types'
import { AnnotationsSidebarInPageEventEmitter } from '../types'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import { DEF_RESULT_LIMIT } from '../constants'
import { IncomingAnnotationData } from 'src/in-page-ui/shared-state/types'
import {
    generateUrl,
    getLastSharedAnnotationTimestamp,
    setLastSharedAnnotationTimestamp,
} from 'src/annotations/utils'
import createResolvable from '@josephg/resolvable'
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'

interface EditForm {
    isBookmarked: boolean
    isTagInputActive: boolean
    commentText: string
    tags: string[]
}

export interface SidebarContainerState {
    loadState: TaskState
    primarySearchState: TaskState
    secondarySearchState: TaskState

    showState: 'visible' | 'hidden'

    annotationSharingAccess: AnnotationSharingAccess
    annotationSharingInfo: {
        [annotationUrl: string]: AnnotationSharingInfo
    }

    copyPasterAccess: boolean
    showAllNotesCopyPaster: boolean
    activeCopyPasterAnnotationId: string | undefined

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
        form: EditForm
    }

    editForms: {
        [annotationUrl: string]: EditForm
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
    showAnnotationsShareModal: boolean
    showBetaFeatureNotifModal: boolean

    showAllNotesShareMenu: boolean
    activeShareMenuNoteId: string | undefined
}

export type SidebarContainerEvents = UIEvent<{
    show: null
    hide: null

    // Adding a new page comment
    addNewPageComment: null
    setNewPageCommentAnchor: { anchor: Anchor }
    changePageCommentText: { comment: string }
    changeEditCommentText: { annotationUrl: string; comment: string }
    saveNewPageComment: {
        anchor?: Anchor
        commentText: string
        isBookmarked: boolean
        tags: string[]
    }
    cancelNewPageComment: null
    toggleNewPageCommentBookmark: null
    togglePageCommentTags: null
    toggleNewPageCommentTagPicker: null
    setNewPageCommentTagPicker: { active: boolean }
    setEditCommentTagPicker: { annotationUrl: string; active: boolean }

    updateTagsForEdit: {
        added?: string
        deleted?: string
        annotationUrl: string
    }
    updateTagsForNewComment: { added?: string; deleted?: string }
    // updateTagsForResult: { added: string; deleted: string; url: string }
    updateListsForPageResult: { added?: string; deleted?: string; url: string }
    addNewPageCommentTag: { tag: string }
    deleteEditCommentTag: { tag: string; annotationUrl: string }
    deleteNewPageCommentTag: { tag: string }
    // closeComments: null,

    receiveNewAnnotation: {
        annotationUrl: string
        annotationData: IncomingAnnotationData
        anchor?: Anchor
    }

    receiveSharingAccessChange: {
        sharingAccess: AnnotationSharingAccess
    }

    // Annotation boxes
    goToAnnotation: {
        context: AnnotationEventContext
        annotationUrl: string
    }
    goToAnnotationInNewTab: {
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
    shareAnnotation: {
        context: AnnotationEventContext
        annotationUrl: string
    }
    unshareAnnotation: {
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

    updateAnnotationShareInfo: {
        annotationUrl: string
        info: Partial<AnnotationSharingInfo>
    }
    updateAllAnnotationsShareInfo: {
        info: AnnotationSharingInfo
    }

    setAnnotationShareModalShown: { shown: boolean }
    setBetaFeatureNotifModalShown: { shown: boolean }

    setAllNotesCopyPasterShown: { shown: boolean }
    setCopyPasterAnnotationId: { id: string }
    resetCopyPasterAnnotationId: null

    setAllNotesShareMenuShown: { shown: boolean }
    setShareMenuNoteId: { id: string }
    resetShareMenuNoteId: null

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

export const INIT_FORM_STATE: SidebarContainerState['commentBox'] = {
    anchor: null,
    form: {
        isBookmarked: false,
        isTagInputActive: false,
        commentText: '',
        tags: [],
    },
}

export const createEditFormsForAnnotations = (annots: Annotation[]) => {
    const state: { [annotationUrl: string]: EditForm } = {}
    for (const annot of annots) {
        state[annot.url] = { ...INIT_FORM_STATE.form }
    }
    return state
}

export class SidebarContainerLogic extends UILogic<
    SidebarContainerState,
    SidebarContainerEvents
> {
    private inPageEvents: AnnotationsSidebarInPageEventEmitter
    _detectedSharedAnnotations = createResolvable()

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
            annotationSharingInfo: {},
            annotationSharingAccess: 'feature-disabled',

            copyPasterAccess: false,
            showAllNotesCopyPaster: false,
            activeCopyPasterAnnotationId: undefined,

            commentBox: { ...INIT_FORM_STATE },
            editForms: {},
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

            showAnnotationsShareModal: false,
            showBetaFeatureNotifModal: false,
            showAllNotesShareMenu: false,
            activeShareMenuNoteId: undefined,
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        this.options.annotationsCache.annotationChanges.addListener(
            'newState',
            this.annotationSubscription,
        )

        // Set initial state, based on what's in the cache (assuming it already has been hydrated)
        this.annotationSubscription(this.options.annotationsCache.annotations)

        await loadInitial<SidebarContainerState>(this, async () => {
            // If `pageUrl` prop passed down, load search results on init, else just wait
            if (this.options.pageUrl != null) {
                await this._doSearch(previousState, { overwrite: true })
            }

            await this.loadBeta()
        })
    }

    cleanup = () => {
        this.options.annotationsCache.annotationChanges.removeListener(
            'newState',
            this.annotationSubscription,
        )
    }

    private annotationSubscription = (annotations: Annotation[]) => {
        this.emitMutation({
            annotations: { $set: annotations },
            editForms: {
                $set: createEditFormsForAnnotations(annotations),
            },
        })
        this._detectSharedAnnotations(
            annotations.map((annotation) => annotation.url),
        )
    }

    private async loadBeta() {
        const isAllowed = await this.options.auth.isAuthorizedForFeature('beta')

        this.emitMutation({
            annotationSharingAccess: {
                $set: isAllowed ? 'sharing-allowed' : 'feature-disabled',
            },
            copyPasterAccess: { $set: isAllowed },
        })
    }

    show: EventHandler<'show'> = async () => {
        this.emitMutation({ showState: { $set: 'visible' } })
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
                if (opts.overwrite && state.pageUrl != null) {
                    await this.options.annotationsCache.load(state.pageUrl)
                }
                // return this.doAnnotationSearch(state, opts)
            },
        )
    }

    private async doAnnotationSearch(
        state: SidebarContainerState,
        opts: { overwrite: boolean },
    ) {
        // this.options.annotationsCache.load()
        // this.emitMutation({
        //     annotations: { $set:  },
        // })
        // const annotations = await this.options.annotations.getAllAnnotationsByUrl(
        //     {
        //         base64Img: true,
        //         url: state.pageUrl,
        //         skip: state.searchResultSkip,
        //         limit: this.resultLimit,
        //     },
        // )
        // if (opts.overwrite) {
        //     this.emitMutation({
        //         annotations: { $set: annotations },
        //         editForms: { $set: createEditFormsForAnnotations(annotations) },
        //         pageCount: { $set: annotations.length },
        //         noResults: { $set: annotations.length < this.resultLimit },
        //         searchResultSkip: { $set: 0 },
        //     })
        // } else {
        //     this.emitMutation({
        //         annotations: { $apply: (prev) => [...prev, ...annotations] },
        //         editForms: {
        //             $apply: (prev) => ({
        //                 ...prev,
        //                 ...createEditFormsForAnnotations(annotations),
        //             }),
        //         },
        //         pageCount: { $apply: (prev) => prev + annotations.length },
        //         noResults: { $set: annotations.length < this.resultLimit },
        //     })
        // }
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

    resetShareMenuNoteId: EventHandler<'resetShareMenuNoteId'> = ({}) => {
        this.emitMutation({ activeShareMenuNoteId: { $set: undefined } })
    }

    setShareMenuNoteId: EventHandler<'setShareMenuNoteId'> = ({
        event,
        previousState,
    }) => {
        const newId =
            previousState.activeShareMenuNoteId === event.id
                ? undefined
                : event.id

        this.emitMutation({ activeShareMenuNoteId: { $set: newId } })
    }

    setAllNotesShareMenuShown: EventHandler<'setAllNotesShareMenuShown'> = ({
        event,
    }) => {
        this.emitMutation({
            showAllNotesShareMenu: { $set: event.shown },
        })
    }

    setAllNotesCopyPasterShown: EventHandler<'setAllNotesCopyPasterShown'> = ({
        event,
    }) => {
        this.emitMutation({
            showAllNotesCopyPaster: { $set: event.shown },
            activeCopyPasterAnnotationId: { $set: undefined },
        })
    }

    setCopyPasterAnnotationId: EventHandler<'setCopyPasterAnnotationId'> = ({
        event,
        previousState,
    }) => {
        const newId =
            previousState.activeCopyPasterAnnotationId === event.id
                ? undefined
                : event.id

        this.emitMutation({
            activeCopyPasterAnnotationId: { $set: newId },
            showAllNotesCopyPaster: { $set: false },
        })
    }

    resetCopyPasterAnnotationId: EventHandler<
        'resetCopyPasterAnnotationId'
    > = () => {
        this.emitMutation({
            showAllNotesCopyPaster: { $set: false },
            activeCopyPasterAnnotationId: { $set: undefined },
        })
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

    changeEditCommentText: EventHandler<'changeEditCommentText'> = ({
        event,
    }) => {
        this.emitMutation({
            editForms: {
                [event.annotationUrl]: { commentText: { $set: event.comment } },
            },
        })
    }
    changePageCommentText: EventHandler<'changePageCommentText'> = ({
        event,
    }) => {
        this.emitMutation({
            commentBox: {
                form: { commentText: { $set: event.comment } },
            },
        })
    }

    receiveNewAnnotation: EventHandler<'receiveNewAnnotation'> = async ({
        event: { annotationUrl, anchor, annotationData },
    }) => {
        const createdWhen = new Date()

        const highlight: Annotation = {
            url: annotationUrl,
            isBookmarked: annotationData.isBookmarked,
            comment: annotationData.commentText,
            body: annotationData.highlightText,
            pageUrl: this.options.pageUrl,
            pageTitle: this.options.pageTitle,
            tags: annotationData.tags ?? [],
            lastEdited: createdWhen,
            selector: anchor,
            createdWhen,
        }

        this.emitMutation({
            annotations: { $apply: (prev) => [highlight, ...prev] },
            editForms: {
                $apply: (prev) => ({
                    [annotationUrl]: { ...INIT_FORM_STATE.form },
                    ...prev,
                }),
            },
        })
    }

    receiveSharingAccessChange: EventHandler<'receiveSharingAccessChange'> = ({
        event: { sharingAccess },
    }) => {
        this.emitMutation({ annotationSharingAccess: { $set: sharingAccess } })
    }

    // TODO (sidebar-refactor) reconcile this duplicate code with ribbon notes save
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
        const url = generateUrl({
            pageUrl,
            now: () => Date.now(),
        })

        this.options.annotationsCache.create({
            url,
            pageUrl,
            comment,
            body,
            tags: event.tags,
            isBookmarked: event.isBookmarked,
            selector: event.anchor,
        })

        this.emitMutation({
            commentBox: { $set: INIT_FORM_STATE },
            showCommentBox: { $set: false },
        })
    }

    cancelNewPageComment: EventHandler<'cancelNewPageComment'> = () => {
        this.inPageEvents.emit('removeTemporaryHighlights')
        this.emitMutation({
            commentBox: { $set: INIT_FORM_STATE },
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

    private createTagsStateUpdater = (args: {
        added?: string
        deleted?: string
    }): ((tags: string[]) => string[]) => {
        if (args.added) {
            return (tags) => {
                const tag = args.added
                return tags.includes(tag) ? tags : [...tags, tag]
            }
        }

        return (tags) => {
            const index = tags.indexOf(args.deleted)
            if (index === -1) {
                return tags
            }

            return [...tags.slice(0, index), ...tags.slice(index + 1)]
        }
    }

    updateTagsForEdit: EventHandler<'updateTagsForEdit'> = async ({
        event,
    }) => {
        const tagsStateUpdater = this.createTagsStateUpdater(event)

        this.emitMutation({
            editForms: {
                [event.annotationUrl]: { tags: { $apply: tagsStateUpdater } },
            },
        })
    }

    updateTagsForNewComment: EventHandler<'updateTagsForNewComment'> = async ({
        event,
    }) => {
        const tagsStateUpdater = this.createTagsStateUpdater(event)

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

    setEditCommentTagPicker: EventHandler<'setEditCommentTagPicker'> = ({
        event,
    }) => {
        this.emitMutation({
            editForms: {
                [event.annotationUrl]: {
                    isTagInputActive: { $set: event.active },
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

    private createTagStateDeleteUpdater = (args: { tag: string }) => (
        tags: string[],
    ) => {
        const tagIndex = tags.indexOf(args.tag)
        if (tagIndex === -1) {
            return tags
        }

        tags = [...tags]
        tags.splice(tagIndex, 1)
        return tags
    }

    deleteEditCommentTag: EventHandler<'deleteEditCommentTag'> = ({
        event,
    }) => {
        this.emitMutation({
            editForms: {
                [event.annotationUrl]: {
                    tags: {
                        $apply: this.createTagStateDeleteUpdater(event),
                    },
                },
            },
        })
    }

    deleteNewPageCommentTag: EventHandler<'deleteNewPageCommentTag'> = ({
        event,
    }) => {
        this.emitMutation({
            commentBox: {
                form: {
                    tags: {
                        $apply: this.createTagStateDeleteUpdater(event),
                    },
                },
            },
        })
    }

    setActiveAnnotationUrl = async ({ event }) =>
        this.emitMutation({ activeAnnotationUrl: { $set: event } })

    goToAnnotationInNewTab: EventHandler<'goToAnnotationInNewTab'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            activeAnnotationUrl: { $set: event.annotationUrl },
        })

        const annotation = previousState.annotations.find(
            (annot) => annot.url === event.annotationUrl,
        )

        return this.options.annotations.goToAnnotationFromSidebar({
            url: annotation.pageUrl,
            annotation,
        })
    }

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

        this.inPageEvents.emit('highlightAndScroll', {
            url: event.annotationUrl,
        })
    }

    editAnnotation: EventHandler<'editAnnotation'> = async ({
        event,
        previousState,
    }) => {
        const {
            editForms: { [event.annotationUrl]: form },
        } = previousState

        const resultIndex = previousState.annotations.findIndex(
            (annot) => annot.url === event.annotationUrl,
        )
        const annotation = previousState.annotations[resultIndex]
        const comment = form.commentText.trim()

        this.options.annotationsCache.update({
            ...annotation,
            comment,
            tags: form.tags,
        })

        this.emitMutation({
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            },
            editForms: {
                [event.annotationUrl]: {
                    $set: { ...INIT_FORM_STATE.form },
                },
            },
        })
    }

    deleteAnnotation: EventHandler<'deleteAnnotation'> = async ({
        event,
        previousState,
    }) => {
        const resultIndex = previousState.annotations.findIndex(
            (annot) => annot.url === event.annotationUrl,
        )
        const annotation = previousState.annotations[resultIndex]
        this.options.annotationsCache.delete(annotation)
    }

    shareAnnotation: EventHandler<'shareAnnotation'> = async ({
        event,
        previousState,
    }) => {
        if (previousState.annotationSharingAccess === 'feature-disabled') {
            this.options.showBetaFeatureNotifModal?.()
            return
        }

        this.emitMutation({
            activeShareMenuNoteId: { $set: event.annotationUrl },
        })
    }

    unshareAnnotation: EventHandler<'unshareAnnotation'> = async ({
        event,
        previousState,
    }) => {
        if (previousState.annotationSharingAccess === 'feature-disabled') {
            this.options.showBetaFeatureNotifModal?.()
            return
        }

        this.emitMutation({
            activeShareMenuNoteId: { $set: event.annotationUrl },
        })
    }

    toggleAnnotationBookmark: EventHandler<
        'toggleAnnotationBookmark'
    > = async ({ previousState, event }) => {
        const resultIndex = previousState.annotations.findIndex(
            (annot) => annot.url === event.annotationUrl,
        )
        const annotation = previousState.annotations[resultIndex]
        const isBookmarked = !annotation.isBookmarked

        this.options.annotationsCache.update({
            ...annotation,
            isBookmarked,
        })
    }

    setAnnotationEditMode: EventHandler<'setAnnotationEditMode'> = ({
        event,
        previousState,
    }) => {
        const annotation = previousState.annotations.find(
            (annot) => annot.url === event.annotationUrl,
        )

        this.emitMutation({
            editForms: {
                [event.annotationUrl]: {
                    commentText: { $set: annotation.comment ?? '' },
                    tags: { $set: annotation.tags ?? [] },
                    isBookmarked: { $set: !!annotation.isBookmarked },
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
        let extraMutation: UIMutation<SidebarContainerState> = {}

        if (event.mode === 'default') {
            extraMutation = {
                editForms: {
                    [event.annotationUrl]: {
                        $set: { ...INIT_FORM_STATE.form },
                    },
                },
            }
        }

        this.emitMutation({
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: {
                        $set: event.mode,
                    },
                },
            },
            ...extraMutation,
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

    setAnnotationShareModalShown: EventHandler<
        'setAnnotationShareModalShown'
    > = ({ event }) => {
        this.emitMutation({ showAnnotationsShareModal: { $set: event.shown } })
    }

    setBetaFeatureNotifModalShown: EventHandler<
        'setBetaFeatureNotifModalShown'
    > = ({ event }) => {
        this.emitMutation({ showBetaFeatureNotifModal: { $set: event.shown } })
    }

    async _detectSharedAnnotations(annotationUrls: string[]) {
        const annotationSharingInfo: UIMutation<
            SidebarContainerState['annotationSharingInfo']
        > = {}
        const remoteIds = await this.options.contentSharing.getRemoteAnnotationIds(
            { annotationUrls },
        )
        for (const localId of Object.keys(remoteIds)) {
            annotationSharingInfo[localId] = {
                $set: {
                    status: 'shared',
                    taskState: 'pristine',
                },
            }
        }
        this.emitMutation({
            annotationSharingInfo,
        })
    }

    updateAllAnnotationsShareInfo: EventHandler<
        'updateAllAnnotationsShareInfo'
    > = ({ previousState: { annotations }, event }) => {
        const sharingInfo = {}

        for (const { url } of annotations) {
            sharingInfo[url] = { ...event.info }
        }

        this.emitMutation({ annotationSharingInfo: { $set: sharingInfo } })
        console.log('setting: ', sharingInfo)
    }

    updateAnnotationShareInfo: EventHandler<'updateAnnotationShareInfo'> = ({
        previousState: { annotationSharingInfo },
        event,
    }) => {
        this.emitMutation({
            annotationSharingInfo: {
                $merge: {
                    [event.annotationUrl]: {
                        ...annotationSharingInfo[event.annotationUrl],
                        ...event.info,
                    },
                },
            },
        })
    }

    private async setLastSharedAnnotationTimestamp() {
        const lastShared = await getLastSharedAnnotationTimestamp()

        if (lastShared == null) {
            this.options.showAnnotationShareModal?.()
        }

        await setLastSharedAnnotationTimestamp()
    }
}
