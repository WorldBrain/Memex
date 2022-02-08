import fromPairs from 'lodash/fromPairs'
import { isFullUrl, normalizeUrl } from '@worldbrain/memex-url-utils'
import {
    UILogic,
    UIEventHandler,
    UIMutation,
    loadInitial,
    executeUITask,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    annotationConversationInitialState,
    annotationConversationEventHandlers,
    detectAnnotationConversationThreads,
} from '@worldbrain/memex-common/lib/content-conversations/ui/logic'
import { Annotation } from 'src/annotations/types'
import type {
    SidebarContainerDependencies,
    SidebarContainerState,
    SidebarContainerEvents,
    EditForm,
    EditForms,
} from './types'
import { AnnotationsSidebarInPageEventEmitter } from '../types'
import { DEF_RESULT_LIMIT } from '../constants'
import { generateUrl } from 'src/annotations/utils'
import { FocusableComponent } from 'src/annotations/components/types'
import { CachedAnnotation } from 'src/annotations/annotations-cache'
import { initNormalizedState } from 'src/common-ui/utils'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { AnnotationSharingState } from 'src/content-sharing/background/types'
import { getAnnotationPrivacyState } from '@worldbrain/memex-common/lib/content-sharing/utils'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { Browser, browser } from 'webextension-polyfill-ts'
import { SIDEBAR_WIDTH_STORAGE_KEY } from '../constants'

export type SidebarContainerOptions = SidebarContainerDependencies & {
    events?: AnnotationsSidebarInPageEventEmitter
}

export type SidebarLogicOptions = SidebarContainerOptions & {
    focusCreateForm: FocusableComponent['focus']
    setLoginModalShown?: (isShown: boolean) => void
    setDisplayNameModalShown?: (isShown: boolean) => void
}

type EventHandler<
    EventName extends keyof SidebarContainerEvents
> = UIEventHandler<SidebarContainerState, SidebarContainerEvents, EventName>

export const INIT_FORM_STATE: EditForm = {
    isBookmarked: false,
    isTagInputActive: false,
    commentText: '',
    tags: [],
    lists: [],
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
    syncSettings: SyncSettingsStore<'contentSharing'>

    constructor(private options: SidebarLogicOptions) {
        super()

        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: options.syncSettingsBG,
        })

        Object.assign(
            this,
            annotationConversationEventHandlers<SidebarContainerState>(
                this as any,
                {
                    getSharedListReference: () => null,
                    loadUserByReference: options.auth.getUserByReference,
                    submitNewReply: options.contentConversationsBG.submitReply,
                    isAuthorizedToConverse: async () => true,
                    getCurrentUser: async () => {
                        const user = await options.auth.getCurrentUser()
                        if (!user) {
                            return null
                        }

                        return {
                            displayName: user.displayName,
                            reference: { type: 'user-reference', id: user.id },
                        }
                    },
                    selectAnnotationData: (state, reference) => {
                        const annotation =
                            state.followedAnnotations[reference.id]
                        if (!annotation) {
                            return null
                        }
                        return {
                            normalizedPageUrl: normalizeUrl(
                                state.pageUrl ?? options.pageUrl,
                            ),

                            pageCreatorReference: {
                                id: annotation.creatorId,
                                type: 'user-reference',
                            },
                        }
                    },
                    getSharedAnnotationLinkID: ({ id }) =>
                        typeof id === 'string' ? id : id.toString(),
                    getOrCreateConversationThread: async ({
                        annotationReference,
                        ...params
                    }) =>
                        options.contentConversationsBG.getOrCreateThread({
                            ...params,
                            sharedAnnotationReference: annotationReference,
                        }),
                    getRepliesByAnnotation: async ({ annotationReference }) =>
                        options.contentConversationsBG.getRepliesBySharedAnnotation(
                            {
                                sharedAnnotationReference: annotationReference,
                            },
                        ),
                },
            ),
        )
    }

    private get resultLimit(): number {
        return this.options.searchResultLimit ?? DEF_RESULT_LIMIT
    }

    getInitialState(): SidebarContainerState {
        return {
            ...annotationConversationInitialState(),

            isExpanded: true,
            isExpandedSharedSpaces: false,
            sidebarWidth: '450px',
            loadState: 'pristine',
            primarySearchState: 'pristine',
            secondarySearchState: 'pristine',
            followedListLoadState: 'pristine',

            followedLists: initNormalizedState(),
            followedAnnotations: {},
            listData: {},
            users: {},

            isWidthLocked: false,
            isLocked: false,
            pageUrl: this.options.pageUrl,
            showState: this.options.initialState ?? 'hidden',
            annotationModes: {
                pageAnnotations: {},
                searchResults: {},
            },
            annotationSharingAccess: 'sharing-allowed',

            showAllNotesCopyPaster: false,
            activeCopyPasterAnnotationId: undefined,
            activeTagPickerAnnotationId: undefined,
            activeListPickerAnnotationId: undefined,

            commentBox: { ...INIT_FORM_STATE },
            editForms: {},

            annotations: [],
            activeAnnotationUrl: null,

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
            searchResultSkip: 0,

            showLoginModal: false,
            showDisplayNameSetupModal: false,
            showAnnotationsShareModal: false,
            showAllNotesShareMenu: false,
            activeShareMenuNoteId: undefined,
            immediatelyShareNotes: false,
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const { annotationsCache, pageUrl, customLists } = this.options
        annotationsCache.annotationChanges.addListener(
            'newState',
            this.annotationSubscription,
        )

        const SidebarInitialWidth = getLocalStorage(
            SIDEBAR_WIDTH_STORAGE_KEY,
        ).then((width) => {
            if (!width) {
                setLocalStorage(SIDEBAR_WIDTH_STORAGE_KEY, '450px')
            }
        })

        // Set initial state, based on what's in the cache (assuming it already has been hydrated)
        this.annotationSubscription(annotationsCache.annotations)

        await loadInitial<SidebarContainerState>(this, async () => {
            const lists = await customLists.fetchAllLists({})
            const listData: SidebarContainerState['listData'] = {}
            lists.forEach((l) => (listData[l.id] = { name: l.name }))

            this.emitMutation({ listData: { $set: listData } })

            // If `pageUrl` prop passed down, load search results on init, else just wait
            if (pageUrl) {
                await annotationsCache.load(pageUrl)
            }
        })

        // load followed lists
        if (previousState.followedListLoadState === 'pristine') {
            await this.processUIEvent('loadFollowedLists', {
                previousState: previousState,
                event: null,
            })
        }
    }

    cleanup = () => {
        this.options.annotationsCache.annotationChanges.removeListener(
            'newState',
            this.annotationSubscription,
        )
    }
    private annotationSubscription = (nextAnnotations: CachedAnnotation[]) => {
        const mutation: UIMutation<SidebarContainerState> = {
            annotations: {
                $set: nextAnnotations,
            },
            editForms: {
                $apply: (editForms: EditForms) => {
                    for (const { url } of nextAnnotations) {
                        if (editForms[url] == null) {
                            editForms[url] = { ...INIT_FORM_STATE }
                        }
                    }
                    return editForms
                },
            },
        }

        this.emitMutation(mutation)
    }

    sortAnnotations: EventHandler<'sortAnnotations'> = ({
        event: { sortingFn },
    }) => this.options.annotationsCache.sort(sortingFn)

    private async ensureLoggedIn(): Promise<boolean> {
        const {
            auth,
            setLoginModalShown,
            setDisplayNameModalShown,
        } = this.options

        const user = await auth.getCurrentUser()
        if (user != null) {
            const userProfile = await auth.getUserProfile()
            if (!userProfile?.displayName?.length) {
                setDisplayNameModalShown?.(true)
                this.emitMutation({ showDisplayNameSetupModal: { $set: true } })
                return false
            }

            setLoginModalShown?.(false)
            setDisplayNameModalShown?.(false)
            this.emitMutation({
                annotationSharingAccess: { $set: 'sharing-allowed' },
            })
            return true
        }

        setLoginModalShown?.(true)
        this.emitMutation({ showLoginModal: { $set: true } })
        return false
    }

    adjustSidebarWidth = (changes) => {
        let SidebarWidth = changes[SIDEBAR_WIDTH_STORAGE_KEY].newValue.replace(
            'px',
            '',
        )
        SidebarWidth = parseFloat(SidebarWidth)
        let windowWidth = window.innerWidth
        let width = (windowWidth - SidebarWidth - 40).toString()
        width = width + 'px'
        document.body.style.width = width
    }

    show: EventHandler<'show'> = async () => {
        this.emitMutation({ showState: { $set: 'visible' } })
    }

    hide: EventHandler<'hide'> = () => {
        this.emitMutation({
            showState: { $set: 'hidden' },
            activeAnnotationUrl: { $set: null },
        })
        document.body.style.width = window.innerWidth.toString() + 'px'
    }

    lock: EventHandler<'lock'> = () =>
        this.emitMutation({ isLocked: { $set: true } })
    unlock: EventHandler<'unlock'> = () =>
        this.emitMutation({ isLocked: { $set: false } })

    lockWidth: EventHandler<'lockWidth'> = () => {
        getLocalStorage(SIDEBAR_WIDTH_STORAGE_KEY).then((width) => {
            let SidebarInitialAsInteger = parseFloat(
                width.toString().replace('px', ''),
            )
            let WindowInitialWidth =
                (window.innerWidth - SidebarInitialAsInteger - 40).toString() +
                'px'
            document.body.style.width = WindowInitialWidth
        })

        browser.storage.onChanged.addListener(this.adjustSidebarWidth)

        this.emitMutation({ isWidthLocked: { $set: true } })
    }

    unlockWidth: EventHandler<'unlockWidth'> = () => {
        document.body.style.width = window.innerWidth.toString() + 'px'
        browser.storage.onChanged.removeListener(this.adjustSidebarWidth)
        this.emitMutation({ isWidthLocked: { $set: false } })
    }

    copyNoteLink: EventHandler<'copyNoteLink'> = async ({
        event: { link },
    }) => {
        this.options.analytics.trackEvent({
            category: 'ContentSharing',
            action: 'copyNoteLink',
        })

        await this.options.copyToClipboard(link)
    }

    copyPageLink: EventHandler<'copyPageLink'> = async ({
        event: { link },
    }) => {
        this.options.analytics.trackEvent({
            category: 'ContentSharing',
            action: 'copyPageLink',
        })

        await this.options.copyToClipboard(link)
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

        // await this.doSearch(nextState, { overwrite: false })
    }

    setPageUrl: EventHandler<'setPageUrl'> = async ({
        previousState,
        event,
    }) => {
        const { annotationsCache, events } = this.options

        if (!isFullUrl(event.pageUrl)) {
            throw new Error(
                'Tried to set annotation sidebar with a normalized page URL',
            )
        }

        if (previousState.pageUrl === event.pageUrl) {
            return
        }

        this.emitMutation({
            followedLists: { $set: initNormalizedState() },
            followedListLoadState: { $set: 'pristine' },
            followedAnnotations: { $set: {} },
            pageUrl: { $set: event.pageUrl },
            users: { $set: {} },
        })

        await annotationsCache.load(event.pageUrl)

        if (event.rerenderHighlights) {
            events?.emit('renderHighlights', {
                highlights: annotationsCache.highlights,
            })
        }
    }

    resetShareMenuNoteId: EventHandler<'resetShareMenuNoteId'> = ({}) => {
        this.emitMutation({
            activeShareMenuNoteId: { $set: undefined },
            immediatelyShareNotes: { $set: false },
        })
    }

    setAllNotesShareMenuShown: EventHandler<
        'setAllNotesShareMenuShown'
    > = async ({ previousState, event }) => {
        if (!(await this.ensureLoggedIn())) {
            return
        }

        this.emitMutation({
            showAllNotesShareMenu: { $set: event.shown },
        })
    }

    setLoginModalShown: EventHandler<'setLoginModalShown'> = ({ event }) => {
        this.emitMutation({ showLoginModal: { $set: event.shown } })
    }

    setDisplayNameSetupModalShown: EventHandler<
        'setDisplayNameSetupModalShown'
    > = ({ event }) => {
        this.emitMutation({ showDisplayNameSetupModal: { $set: event.shown } })
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

    setTagPickerAnnotationId: EventHandler<'setTagPickerAnnotationId'> = ({
        event,
        previousState,
    }) => {
        const newId =
            previousState.activeTagPickerAnnotationId === event.id
                ? undefined
                : event.id

        this.emitMutation({
            activeTagPickerAnnotationId: { $set: newId },
        })
    }

    resetTagPickerAnnotationId: EventHandler<
        'resetTagPickerAnnotationId'
    > = () => {
        this.emitMutation({ activeTagPickerAnnotationId: { $set: undefined } })
    }

    setListPickerAnnotationId: EventHandler<'setListPickerAnnotationId'> = ({
        event,
        previousState,
    }) => {
        const newId =
            previousState.activeListPickerAnnotationId === event.id
                ? undefined
                : event.id
        this.emitMutation({
            activeListPickerAnnotationId: { $set: newId },
        })
    }

    resetListPickerAnnotationId: EventHandler<
        'resetListPickerAnnotationId'
    > = () => {
        this.emitMutation({ activeListPickerAnnotationId: { $set: undefined } })
    }

    resetCopyPasterAnnotationId: EventHandler<
        'resetCopyPasterAnnotationId'
    > = () => {
        this.emitMutation({
            showAllNotesCopyPaster: { $set: false },
            activeCopyPasterAnnotationId: { $set: undefined },
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
        event,
        previousState,
    }) => {
        const { commentBox, pageUrl } = previousState
        const comment = commentBox.commentText.trim()
        if (comment.length === 0) {
            return
        }

        const annotationUrl = generateUrl({ pageUrl, now: () => Date.now() })

        this.emitMutation({
            commentBox: { $set: INIT_FORM_STATE },
            showCommentBox: { $set: false },
        })

        if (event.shouldShare && !(await this.ensureLoggedIn())) {
            return
        }

        const nextAnnotation = await this.options.annotationsCache.create(
            {
                url: annotationUrl,
                pageUrl,
                comment,
                tags: commentBox.tags,
                lists: commentBox.lists,
            },
            {
                shouldShare: event.shouldShare,
                shouldCopyShareLink: event.shouldShare,
                isBulkShareProtected: event.isProtected,
            },
        )
        console.log('saveNewPageComment', {
            nextAnnotation,
            annotationUrl,
            commentBox,
        })
        // check if annotation has lists with remoteId and reload them
        // for (const listName of nextAnnotation.lists) {
        //     const list = await this.options.customLists.fetchListByName({
        //         name: listName,
        //     })
        //     if (list.remoteId) {
        //         // Want to update the list with the new page comment / note, the following isn't enough though
        //         // await this.processUIEvent('loadFollowedLists', {
        //         //     previousState: previousState,
        //         //     event: null,
        //         // })
        //     }
        // }
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

    updateListsForAnnotation: EventHandler<
        'updateListsForAnnotation'
    > = async ({ event, previousState }) => {
        const { contentSharing } = this.options

        const idx = previousState.annotations.findIndex(
            (annot) => annot.url === event.annotationId,
        )
        if (idx === -1) {
            return
        }

        let listIds = previousState.annotations[idx].lists
        if (event.added != null) {
            await contentSharing.shareAnnotationToSomeLists({
                annotationUrl: event.annotationId,
                localListIds: [event.added],
            })
            listIds = [...listIds, event.added]
        }
        if (event.deleted != null) {
            await contentSharing.unshareAnnotationFromSomeLists({
                annotationUrl: event.annotationId,
                localListIds: [event.deleted],
            })
            const toRemove = listIds.findIndex((id) => id === event.deleted)
            listIds = [
                ...listIds.slice(0, toRemove),
                ...listIds.slice(toRemove + 1),
            ]
        }

        this.emitMutation({
            annotations: {
                [idx]: {
                    lists: { $set: listIds },
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

    updateNewPageCommentTags: EventHandler<'updateNewPageCommentTags'> = ({
        event,
    }) => {
        this.emitMutation({
            commentBox: { tags: { $set: event.tags } },
        })
    }
    updateNewPageCommentLists: EventHandler<'updateNewPageCommentLists'> = ({
        event,
    }) => {
        this.emitMutation({
            commentBox: { lists: { $set: event.lists } },
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

    setActiveAnnotationUrl: EventHandler<'setActiveAnnotationUrl'> = async ({
        event,
    }) => {
        this.options.events?.emit('highlightAndScroll', {
            url: event.annotationUrl,
        })
        this.emitMutation({
            activeAnnotationUrl: { $set: event.annotationUrl },
        })
    }

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

    editAnnotation: EventHandler<'editAnnotation'> = async ({
        event,
        previousState,
    }) => {
        const {
            editForms: { [event.annotationUrl]: form },
        } = previousState

        if (event.shouldShare && !(await this.ensureLoggedIn())) {
            return
        }

        const comment = form.commentText.trim()
        const existing = previousState.annotations.find(
            (annot) => annot.url === event.annotationUrl,
        )

        await this.options.annotationsCache.update(
            {
                ...existing,
                comment,
                tags: form.tags,
            },
            {
                shouldShare: event.shouldShare,
                shouldCopyShareLink: event.shouldShare,
                isBulkShareProtected: event.isProtected,
            },
        )

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
        if (!(await this.ensureLoggedIn())) {
            return
        }

        const immediateShare =
            event.mouseEvent.metaKey && event.mouseEvent.altKey

        this.emitMutation({
            activeShareMenuNoteId: { $set: event.annotationUrl },
            immediatelyShareNotes: { $set: !!immediateShare },
        })

        await this.setLastSharedAnnotationTimestamp()
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

    loadFollowedLists: EventHandler<'loadFollowedLists'> = async ({
        previousState,
    }) => {
        const { customLists, pageUrl, contentSharing } = this.options

        await executeUITask(this, 'followedListLoadState', async () => {
            const followedLists = await customLists.fetchFollowedListsWithAnnotations(
                {
                    normalizedPageUrl: normalizeUrl(
                        previousState.pageUrl ?? pageUrl,
                    ),
                },
            )
            const areListsContributable = fromPairs(
                await Promise.all(
                    followedLists.map(async (list) => {
                        const canWrite = await contentSharing.canWriteToSharedListRemoteId(
                            {
                                remoteId: list.id,
                            },
                        )
                        return [list.id, canWrite]
                    }),
                ),
            )

            this.emitMutation({
                followedLists: {
                    allIds: {
                        $set: followedLists.map((list) => list.id),
                    },
                    byId: {
                        $set: fromPairs(
                            followedLists.map((list) => [
                                list.id,
                                {
                                    ...list,
                                    isExpanded: false,
                                    annotationsLoadState: 'pristine',
                                    conversationsLoadState: 'pristine',
                                    isContributable:
                                        areListsContributable[list.id],
                                },
                            ]),
                        ),
                    },
                },
            })
        })
    }

    expandMyNotes: EventHandler<'expandMyNotes'> = async ({
        event,
        previousState,
    }) => {
        const {
            isExpanded: wasExpanded,
            loadState,
            annotations,
        } = previousState

        const annotIds = annotations.map((annot) => annot.url as string)

        const mutation: UIMutation<SidebarContainerState> = {
            isExpanded: { $set: !wasExpanded },
        }
        this.emitMutation(mutation)

        // If collapsing, signal to de-render highlights
        if (wasExpanded) {
            this.options.events?.emit('removeAnnotationHighlights', {
                urls: annotIds,
            })
            return
        }

        this.options.events?.emit('renderHighlights', {
            highlights: annotations
                .filter((annotation) => annotation?.selector != null)
                .map((annotation) => ({
                    url: annotation.url,
                    selector: annotation.selector,
                })),
        })
    }

    expandSharedSpaces: EventHandler<'expandSharedSpaces'> = async ({
        event,
        previousState,
    }) => {
        const wasExpanded = previousState.isExpandedSharedSpaces
        const expandedSharedAnnotationReferences = event.listIds
            .filter((id) => previousState.followedLists.byId[id].isExpanded)
            .map(
                (id) =>
                    previousState.followedLists.byId[id]
                        .sharedAnnotationReferences,
            )
        const sharedAnnotIds = expandedSharedAnnotationReferences
            .flat()
            .map((ref) => ref.id as string)

        const mutation: UIMutation<SidebarContainerState> = {
            isExpandedSharedSpaces: { $set: !wasExpanded },
        }
        this.emitMutation(mutation)

        // If collapsing, signal to de-render highlights
        if (wasExpanded) {
            this.options.events?.emit('removeAnnotationHighlights', {
                urls: sharedAnnotIds,
            })
            return
        }
        this.options.events?.emit('renderHighlights', {
            highlights: sharedAnnotIds
                .filter(
                    (id) =>
                        previousState.followedAnnotations[id]?.selector != null,
                )
                .map((id) => ({
                    url: id,
                    selector: previousState.followedAnnotations[id].selector,
                })),
        })
    }

    private afterToggleListView = async (
        previousState,
        mutation,
        annotationsLoadState,
        event,
        followedAnnotIds,
        shouldRemoveAnnotationHighlights,
    ) => {
        // If collapsing, signal to de-render highlights
        if (shouldRemoveAnnotationHighlights) {
            this.options.events?.emit('removeAnnotationHighlights', {
                urls: followedAnnotIds,
            })
            return
        }

        // If annot data yet to be loaded, load it
        if (annotationsLoadState === 'pristine') {
            await this.processUIEvent('loadFollowedListNotes', {
                event,
                previousState: this.withMutation(previousState, mutation),
            })
            return
        }

        this.options.events?.emit('renderHighlights', {
            highlights: followedAnnotIds
                .filter(
                    (id) =>
                        previousState.followedAnnotations[id]?.selector != null,
                )
                .map((id) => ({
                    url: id,
                    selector: previousState.followedAnnotations[id].selector,
                })),
        })
    }
    expandFollowedListNotes: EventHandler<'expandFollowedListNotes'> = async ({
        event,
        previousState,
    }) => {
        const {
            sharedAnnotationReferences,
            isExpanded: wasExpanded,
            annotationsLoadState,
        } = previousState.followedLists.byId[event.listId]

        const followedAnnotIds = sharedAnnotationReferences.map(
            (ref) => ref.id as string,
        )

        const mutation: UIMutation<SidebarContainerState> = {
            followedLists: {
                byId: {
                    [event.listId]: {
                        isExpanded: { $set: !wasExpanded },
                    },
                },
            },
        }
        this.emitMutation(mutation)

        const shouldRemoveAnnotationHighlights = wasExpanded

        this.afterToggleListView(
            previousState,
            mutation,
            annotationsLoadState,
            event,
            followedAnnotIds,
            shouldRemoveAnnotationHighlights,
        )
    }

    toggleIsolatedListView: EventHandler<'toggleIsolatedListView'> = async ({
        event,
        previousState,
    }) => {
        const {
            sharedAnnotationReferences,
            isExpanded: wasExpanded,
            annotationsLoadState,
        } = previousState.followedLists.byId[event.listId]
        const isolatedView = previousState.isolatedView

        const followedAnnotIds = sharedAnnotationReferences.map(
            (ref) => ref.id as string,
        )

        const mutation: UIMutation<SidebarContainerState> = {
            isolatedView: { $set: isolatedView ? null : event.listId },
            followedLists: {
                byId: {
                    [event.listId]: {
                        isExpanded: { $set: isolatedView ? false : true },
                    },
                },
            },
        }
        this.emitMutation(mutation)

        const shouldRemoveAnnotationHighlights = isolatedView

        this.afterToggleListView(
            previousState,
            mutation,
            annotationsLoadState,
            event,
            followedAnnotIds,
            shouldRemoveAnnotationHighlights,
        )
    }

    loadFollowedListNotes: EventHandler<'loadFollowedListNotes'> = async ({
        event,
        previousState,
    }) => {
        const { annotations, contentConversationsBG } = this.options
        const { sharedAnnotationReferences } = previousState.followedLists.byId[
            event.listId
        ]

        await executeUITask(
            this,
            (taskState) => ({
                followedLists: {
                    byId: {
                        [event.listId]: {
                            annotationsLoadState: { $set: taskState },
                        },
                    },
                },
            }),
            async () => {
                const sharedAnnotations = await annotations.getSharedAnnotations(
                    {
                        sharedAnnotationReferences,
                        withCreatorData: true,
                    },
                )

                this.options.events?.emit('renderHighlights', {
                    highlights: sharedAnnotations
                        .filter((annot) => annot.selector != null)
                        .map((annot) => ({
                            url: annot.reference.id.toString(),
                            selector: annot.selector,
                        })),
                })

                this.emitMutation({
                    followedAnnotations: {
                        $merge: fromPairs(
                            sharedAnnotations.map((annot) => [
                                annot.reference.id,
                                {
                                    id: annot.reference.id,
                                    body: annot.body,
                                    comment: annot.comment,
                                    selector: annot.selector,
                                    createdWhen: annot.createdWhen,
                                    updatedWhen: annot.updatedWhen,
                                    creatorId: annot.creatorReference.id,
                                },
                            ]),
                        ),
                    },
                    users: {
                        $merge: fromPairs(
                            sharedAnnotations.map(
                                ({ creator, creatorReference }) => [
                                    creatorReference.id,
                                    {
                                        name: creator?.user.displayName,
                                        profileImgSrc:
                                            creator?.profile?.avatarURL,
                                    },
                                ],
                            ),
                        ),
                    },
                })
            },
        )

        await executeUITask(
            this,
            (taskState) => ({
                followedLists: {
                    byId: {
                        [event.listId]: {
                            conversationsLoadState: { $set: taskState },
                        },
                    },
                },
            }),
            () =>
                detectAnnotationConversationThreads(this as any, {
                    annotationReferences: sharedAnnotationReferences,
                    getThreadsForAnnotations: ({ annotationReferences }) =>
                        contentConversationsBG.getThreadsForSharedAnnotations({
                            sharedAnnotationReferences: annotationReferences,
                        }),
                }),
        )
    }

    setAnnotationShareModalShown: EventHandler<
        'setAnnotationShareModalShown'
    > = ({ event }) => {
        this.emitMutation({ showAnnotationsShareModal: { $set: event.shown } })
    }

    updateAllAnnotationsShareInfo: EventHandler<
        'updateAllAnnotationsShareInfo'
    > = ({ previousState, event }) => {
        const nextAnnotations = previousState.annotations.map((annotation) => {
            const privacyState = getAnnotationPrivacyState(
                event[annotation.url].privacyLevel,
            )
            const nextAnnotation =
                event[annotation.url] == null
                    ? annotation
                    : {
                          ...annotation,
                          isShared: privacyState.public,
                          isBulkShareProtected: privacyState.protected,
                      }
            return nextAnnotation
        })

        this.emitMutation({ annotations: { $set: nextAnnotations } })
    }

    updateAnnotationShareInfo: EventHandler<'updateAnnotationShareInfo'> = ({
        previousState,
        event,
    }) => {
        const annotationIndex = previousState.annotations.findIndex(
            (a) => a.url === event.annotationUrl,
        )
        const privacyState = getAnnotationPrivacyState(event.privacyLevel)
        this.emitMutation({
            annotations: {
                [annotationIndex]: {
                    isShared: { $set: privacyState.public },
                    isBulkShareProtected: {
                        $apply: (prev) => privacyState.protected,
                    },
                },
            },
        })
    }

    private async setLastSharedAnnotationTimestamp(now = Date.now()) {
        // const lastShared = await this.syncSettings.contentSharing.get(
        //     'lastSharedAnnotationTimestamp',
        // )

        // if (lastShared == null) {
        //     this.options.showAnnotationShareModal?.()
        // }

        await this.syncSettings.contentSharing.set(
            'lastSharedAnnotationTimestamp',
            now,
        )
    }
}
