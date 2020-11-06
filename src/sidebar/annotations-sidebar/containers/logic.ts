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
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import { areTagsEquivalent } from 'src/tags/utils'
import { FocusableComponent } from 'src/annotations/components/types'

export interface EditForm {
    isBookmarked: boolean
    isTagInputActive: boolean
    commentText: string
    tags: string[]
}

export interface EditForms {
    [annotationUrl: string]: EditForm
}

export interface SidebarContainerState {
    loadState: TaskState
    primarySearchState: TaskState
    secondarySearchState: TaskState

    showState: 'visible' | 'hidden'
    isLocked: boolean

    annotationSharingAccess: AnnotationSharingAccess
    annotationSharingInfo: {
        [annotationUrl: string]: AnnotationSharingInfo
    }

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
    commentBox: EditForm

    editForms: EditForms

    pageCount: number
    noResults: boolean

    showCongratsMessage: boolean
    showClearFiltersBtn: boolean
    isSocialPost: boolean

    // Filter sidebar props
    showFiltersSidebar: boolean
    showSocialSearch: boolean

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
    lock: null
    unlock: null

    // Adding a new page comment
    addNewPageComment: { comment?: string; tags?: string[] }
    setNewPageCommentAnchor: { anchor: Anchor }
    changeNewPageCommentText: { comment: string }
    cancelEdit: { annotationUrl: string }
    changeEditCommentText: { annotationUrl: string; comment: string }
    saveNewPageComment: null
    cancelNewPageComment: null
    updateNewPageCommentTags: { tags: string[] }

    setEditCommentTagPicker: { annotationUrl: string; active: boolean }

    updateTagsForEdit: {
        added?: string
        deleted?: string
        annotationUrl: string
    }
    updateListsForPageResult: { added?: string; deleted?: string; url: string }
    deleteEditCommentTag: { tag: string; annotationUrl: string }

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
}>
export type AnnotationEventContext = 'pageAnnotations' | 'searchResults'

export type SidebarContainerOptions = SidebarContainerDependencies & {
    events?: AnnotationsSidebarInPageEventEmitter
}

export type SidebarLogicOptions = SidebarContainerOptions & {
    focusCreateForm: FocusableComponent['focus']
}

type EventHandler<
    EventName extends keyof SidebarContainerEvents
> = UIEventHandler<SidebarContainerState, SidebarContainerEvents, EventName>

export const INIT_FORM_STATE: EditForm = {
    isBookmarked: false,
    isTagInputActive: false,
    commentText: '',
    tags: [],
}

export const createEditFormsForAnnotations = (annots: Annotation[]) => {
    const state: { [annotationUrl: string]: EditForm } = {}
    for (const annot of annots) {
        state[annot.url] = { ...INIT_FORM_STATE }
    }
    return state
}

export class SidebarContainerLogic extends UILogic<
    SidebarContainerState,
    SidebarContainerEvents
> {
    private inPageEvents: AnnotationsSidebarInPageEventEmitter

    constructor(private options: SidebarLogicOptions) {
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

            isLocked: false,
            pageUrl: this.options.pageUrl,
            showState: this.options.initialState ?? 'hidden',
            annotationModes: {
                pageAnnotations: {},
                searchResults: {},
            },
            annotationSharingInfo: {},
            annotationSharingAccess: 'feature-disabled',

            showAllNotesCopyPaster: false,
            activeCopyPasterAnnotationId: undefined,

            commentBox: { ...INIT_FORM_STATE },
            editForms: {},

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

            pageCount: 0,
            noResults: false,
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
                $apply: (editForms: EditForms) => {
                    for (const { url } of annotations) {
                        if (editForms[url] == null) {
                            editForms[url] = { ...INIT_FORM_STATE }
                        }
                    }
                    return editForms
                },
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
        })
    }

    show: EventHandler<'show'> = async () => {
        this.emitMutation({ showState: { $set: 'visible' } })
    }

    lock: EventHandler<'lock'> = () =>
        this.emitMutation({ isLocked: { $set: true } })
    unlock: EventHandler<'unlock'> = () =>
        this.emitMutation({ isLocked: { $set: false } })

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
            },
        )
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
        previousState,
        event,
    }) => {
        if (previousState.annotationSharingAccess === 'feature-disabled') {
            this.options.showBetaFeatureNotifModal?.()
            return
        }

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

    addNewPageComment: EventHandler<'addNewPageComment'> = async ({
        event,
    }) => {
        const mutation: UIMutation<SidebarContainerState> = {
            showCommentBox: { $set: true },
        }

        if (event.comment?.length) {
            mutation.commentBox = {
                ...mutation.commentBox,
                commentText: { $set: event.comment },
            }
        }

        if (event.tags?.length) {
            mutation.commentBox = {
                ...mutation.commentBox,
                tags: { $set: event.tags },
            }
        }

        this.emitMutation(mutation)
        this.options.focusCreateForm()
    }

    // Unused since insta-saving new highlights
    setNewPageCommentAnchor: EventHandler<'setNewPageCommentAnchor'> = (
        incoming,
    ) => {
        this.emitMutation({
            // commentBox: { anchor: { $set: incoming.event.anchor } },
        })
    }

    cancelEdit: EventHandler<'cancelEdit'> = ({ event }) => {
        this.emitMutation({
            annotationModes: {
                pageAnnotations: {
                    [event.annotationUrl]: {
                        $set: 'default',
                    },
                },
            },
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

    changeNewPageCommentText: EventHandler<'changeNewPageCommentText'> = ({
        event,
    }) => {
        this.emitMutation({
            commentBox: { commentText: { $set: event.comment } },
        })
    }

    receiveSharingAccessChange: EventHandler<'receiveSharingAccessChange'> = ({
        event: { sharingAccess },
    }) => {
        this.emitMutation({ annotationSharingAccess: { $set: sharingAccess } })
    }

    // TODO (sidebar-refactor) reconcile this duplicate code with ribbon notes save
    saveNewPageComment: EventHandler<'saveNewPageComment'> = async ({
        previousState: { commentBox, pageUrl },
    }) => {
        const comment = commentBox.commentText.trim()
        if (comment.length === 0) {
            return
        }

        const annotationUrl = generateUrl({ pageUrl, now: () => Date.now() })

        this.options.annotationsCache.create({
            url: annotationUrl,
            pageUrl,
            comment,
            tags: commentBox.tags,
        })

        this.emitMutation({
            commentBox: { $set: INIT_FORM_STATE },
            showCommentBox: { $set: false },
        })
    }

    cancelNewPageComment: EventHandler<'cancelNewPageComment'> = () => {
        this.emitMutation({
            commentBox: { $set: INIT_FORM_STATE },
            showCommentBox: { $set: false },
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

    updateListsForPageResult: EventHandler<
        'updateListsForPageResult'
    > = async ({ event }) => {
        return this.options.customLists.updateListForPage({
            added: event.added,
            deleted: event.deleted,
            url: event.url,
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

    updateNewPageCommentTags: EventHandler<'updateNewPageCommentTags'> = ({
        event,
    }) => {
        this.emitMutation({
            commentBox: { tags: { $set: event.tags } },
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

        const comment = form.commentText.trim()
        const existing = previousState.annotations.find(
            (annot) => annot.url === event.annotationUrl,
        )

        const somethingChanged = !(
            existing.comment === comment &&
            areTagsEquivalent(existing.tags, form.tags)
        )

        if (somethingChanged) {
            this.options.annotationsCache.update({
                ...existing,
                comment,
                tags: form.tags,
            })
        }

        this.emitMutation({
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            },
            editForms: {
                [event.annotationUrl]: {
                    $set: { ...INIT_FORM_STATE },
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
        await this.setLastSharedAnnotationTimestamp()
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
        const previousForm = previousState.editForms[event.annotationUrl]
        const annotation = previousState.annotations.find(
            (annot) => annot.url === event.annotationUrl,
        )

        const mutation: UIMutation<SidebarContainerState> = {
            annotationModes: {
                [event.context]: {
                    [event.annotationUrl]: { $set: 'edit' },
                },
            },
        }

        // If there was existing form state, we want to keep that, else use the stored annot data or defaults
        if (
            !previousForm ||
            (!previousForm?.commentText?.length && !previousForm?.tags?.length)
        ) {
            mutation.editForms = {
                [event.annotationUrl]: {
                    commentText: { $set: annotation.comment ?? '' },
                    tags: { $set: annotation.tags ?? [] },
                },
            }
        }

        this.emitMutation(mutation)
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

        this.emitMutation({ annotationSharingInfo })
    }

    updateAllAnnotationsShareInfo: EventHandler<
        'updateAllAnnotationsShareInfo'
    > = ({ previousState: { annotations }, event }) => {
        const sharingInfo = {}

        for (const { url } of annotations) {
            sharingInfo[url] = { ...event.info }
        }

        this.emitMutation({ annotationSharingInfo: { $set: sharingInfo } })
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
