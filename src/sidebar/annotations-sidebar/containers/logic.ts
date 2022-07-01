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
import type { ConversationIdBuilder } from '@worldbrain/memex-common/lib/content-conversations/ui/types'
import { Annotation } from 'src/annotations/types'
import type {
    SidebarContainerDependencies,
    SidebarContainerState,
    SidebarContainerEvents,
    EditForm,
    EditForms,
    FollowedListState,
} from './types'
import { AnnotationsSidebarInPageEventEmitter } from '../types'
import { DEF_RESULT_LIMIT } from '../constants'
import { generateAnnotationUrl } from 'src/annotations/utils'
import { FocusableComponent } from 'src/annotations/components/types'
import { CachedAnnotation } from 'src/annotations/annotations-cache'
import { initNormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { getAnnotationPrivacyState } from '@worldbrain/memex-common/lib/content-sharing/utils'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { browser } from 'webextension-polyfill-ts'
import { SIDEBAR_WIDTH_STORAGE_KEY } from '../constants'
import { getInitialAnnotationConversationStates } from '@worldbrain/memex-common/lib/content-conversations/ui/utils'
import {
    AnnotationPrivacyState,
    AnnotationPrivacyLevels,
} from '@worldbrain/memex-common/lib/annotations/types'
import { resolvablePromise } from 'src/util/promises'
import type { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { SharedAnnotationList } from 'src/custom-lists/background/types'

export type SidebarContainerOptions = SidebarContainerDependencies & {
    events?: AnnotationsSidebarInPageEventEmitter
}

export type SidebarLogicOptions = SidebarContainerOptions & {
    focusCreateForm: FocusableComponent['focus']
    focusEditNoteForm: (annotationId: string) => void
    setLoginModalShown?: (isShown: boolean) => void
    setDisplayNameModalShown?: (isShown: boolean) => void
}

type EventHandler<
    EventName extends keyof SidebarContainerEvents
> = UIEventHandler<SidebarContainerState, SidebarContainerEvents, EventName>

const buildConversationId: ConversationIdBuilder = (
    baseId,
    sharedListReference,
) =>
    sharedListReference == null
        ? baseId.toString()
        : `${sharedListReference.id}:${baseId}`

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
    /**
     * This exists so the "external action" handling logic (see `AnnotationsSidebarInPage.handleExternalAction`)
     * can trigger mutation events touching the annotation state early, ensuring that they are delayed at least until
     * the annotations data has time to be loaded.
     * The bug that prompted this: shift+clicking newly created highlights on empty pages attempts to activate an annotation
     * before the sidebar script had been loaded before, let alone the annotations data.
     */
    annotationsLoadComplete = resolvablePromise()
    syncSettings: SyncSettingsStore<'contentSharing' | 'extension'>

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
                    buildConversationId,
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
                    getRepliesByAnnotation: async ({
                        annotationReference,
                        sharedListReference,
                    }) =>
                        options.contentConversationsBG.getRepliesBySharedAnnotation(
                            {
                                sharedAnnotationReference: annotationReference,
                                sharedListReference,
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
            noteCreateState: 'pristine',
            annotationsLoadState: 'pristine',
            secondarySearchState: 'pristine',
            followedListLoadState: 'pristine',

            followedLists: initNormalizedState(),
            followedAnnotations: {},
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
            shouldShowTagsUIs: false,

            pageCount: 0,
            noResults: false,
            annotCount: 0,
            shouldShowCount: false,
            isInvalidSearch: false,
            totalResultCount: 0,
            isListFilterActive: false,
            searchResultSkip: 0,

            confirmPrivatizeNoteArgs: null,
            confirmSelectNoteSpaceArgs: null,

            showLoginModal: false,
            showDisplayNameSetupModal: false,
            showAnnotationsShareModal: false,
            showAllNotesShareMenu: false,
            activeShareMenuNoteId: undefined,
            immediatelyShareNotes: false,
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const { pageUrl, annotationsCache } = this.options
        annotationsCache.annotationChanges.addListener(
            'newStateIntent',
            this.annotationSubscription,
        )

        const sidebarInitialWidth = await getLocalStorage(
            SIDEBAR_WIDTH_STORAGE_KEY,
        )
        if (sidebarInitialWidth == null) {
            await setLocalStorage(SIDEBAR_WIDTH_STORAGE_KEY, '450px')
        }

        // Set initial state, based on what's in the cache (assuming it already has been hydrated)
        this.annotationSubscription(annotationsCache.annotations)

        await loadInitial<SidebarContainerState>(this, async () => {
            const areTagsMigrated = await this.syncSettings.extension.get(
                'areTagsMigratedToSpaces',
            )
            this.emitMutation({ shouldShowTagsUIs: { $set: !areTagsMigrated } })

            // If `pageUrl` prop passed down, load search results on init, else just wait
            if (pageUrl != null) {
                await annotationsCache.load(pageUrl)
            }
        })
        this.annotationsLoadComplete.resolve()

        // load followed lists
        if (
            previousState.followedListLoadState === 'pristine' &&
            pageUrl != null
        ) {
            await this.processUIEvent('loadFollowedLists', {
                previousState,
                event: null,
            })
        }
    }

    cleanup = () => {
        this.options.annotationsCache.annotationChanges.removeListener(
            'newStateIntent',
            this.annotationSubscription,
        )
    }

    private annotationSubscription = (nextAnnotations: CachedAnnotation[]) => {
        const mutation: UIMutation<SidebarContainerState> = {
            noteCreateState: { $set: 'success' },
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

        const mutation: UIMutation<SidebarContainerState> = {
            followedLists: { $set: initNormalizedState() },
            followedListLoadState: { $set: 'pristine' },
            followedAnnotations: { $set: {} },
            pageUrl: { $set: event.pageUrl },
            users: { $set: {} },
        }

        this.emitMutation(mutation)

        await Promise.all([
            executeUITask(this, 'annotationsLoadState', async () => {
                await annotationsCache.load(event.pageUrl)
            }),
            this.processUIEvent('loadFollowedLists', {
                previousState: this.withMutation(previousState, mutation),
                event: null,
            }),
        ])

        if (event.rerenderHighlights) {
            events?.emit('renderHighlights', {
                highlights: annotationsCache.highlights,
            })
        }
    }

    resetShareMenuNoteId: EventHandler<'resetShareMenuNoteId'> = ({
        previousState,
    }) => {
        let mutation: UIMutation<SidebarContainerState> = {
            activeShareMenuNoteId: { $set: undefined },
            immediatelyShareNotes: { $set: false },
            confirmPrivatizeNoteArgs: { $set: null },
            confirmSelectNoteSpaceArgs: { $set: null },
            ...this.applyStateMutationForAllFollowedLists(previousState, {
                activeShareMenuAnnotationId: { $set: undefined },
            }),
        }

        this.emitMutation(mutation)
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
        if (event.followedListId != null) {
            const newId =
                previousState.followedLists.byId[event.followedListId]
                    ?.activeCopyPasterAnnotationId === event.id
                    ? undefined
                    : event.id

            this.emitMutation({
                activeCopyPasterAnnotationId: { $set: undefined },
                showAllNotesCopyPaster: { $set: false },
                followedLists: {
                    byId: {
                        [event.followedListId]: {
                            activeCopyPasterAnnotationId: { $set: newId },
                        },
                    },
                },
            })
            return
        }

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
        if (event.followedListId != null) {
            const newId =
                previousState.followedLists.byId[event.followedListId]
                    ?.activeListPickerAnnotationId === event.id
                    ? undefined
                    : event.id

            this.emitMutation({
                activeListPickerAnnotationId: { $set: undefined },
                followedLists: {
                    byId: {
                        [event.followedListId]: {
                            activeListPickerAnnotationId: { $set: newId },
                        },
                    },
                },
            })
            return
        }

        const newId =
            previousState.activeListPickerAnnotationId === event.id
                ? undefined
                : event.id
        this.emitMutation({
            activeListPickerAnnotationId: { $set: newId },
        })
    }

    // TODO: type properly
    private applyStateMutationForAllFollowedLists = (
        previousState: SidebarContainerState,
        mutation: UIMutation<any>,
    ): UIMutation<any> => ({
        followedLists: {
            byId: previousState.followedLists.allIds.reduce(
                (acc, listId) => ({
                    ...acc,
                    [listId]: { ...mutation },
                }),
                {},
            ),
        },
    })

    resetListPickerAnnotationId: EventHandler<
        'resetListPickerAnnotationId'
    > = ({ event, previousState }) => {
        if (event.id != null) {
            this.options.focusEditNoteForm(event.id)
        }

        this.emitMutation({
            activeListPickerAnnotationId: { $set: undefined },
            ...this.applyStateMutationForAllFollowedLists(previousState, {
                activeListPickerAnnotationId: { $set: undefined },
            }),
        })
    }

    resetCopyPasterAnnotationId: EventHandler<
        'resetCopyPasterAnnotationId'
    > = ({ previousState }) => {
        this.emitMutation({
            showAllNotesCopyPaster: { $set: false },
            activeCopyPasterAnnotationId: { $set: undefined },
            ...this.applyStateMutationForAllFollowedLists(previousState, {
                activeCopyPasterAnnotationId: { $set: undefined },
            }),
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

    cancelEdit: EventHandler<'cancelEdit'> = ({ event, previousState }) => {
        this.emitMutation({
            annotationModes: {
                pageAnnotations: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            },
            ...this.applyStateMutationForAllFollowedLists(previousState, {
                annotationModes: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            }),
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

    saveNewPageComment: EventHandler<'saveNewPageComment'> = async ({
        event,
        previousState,
    }) => {
        const { commentBox, pageUrl } = previousState
        const comment = commentBox.commentText.trim()
        if (comment.length === 0) {
            return
        }
        const annotationUrl = generateAnnotationUrl({
            pageUrl,
            now: () => Date.now(),
        })

        this.emitMutation({
            commentBox: { $set: INIT_FORM_STATE },
            showCommentBox: { $set: false },
        })

        await executeUITask(this, 'noteCreateState', async () => {
            if (event.shouldShare && !(await this.ensureLoggedIn())) {
                return
            }

            const nextAnnotation = await this.options.annotationsCache.create(
                {
                    url: annotationUrl,
                    pageUrl,
                    comment,
                    tags: [...commentBox.tags],
                    lists: [...commentBox.lists],
                },
                {
                    shouldShare: event.shouldShare,
                    shouldCopyShareLink: event.shouldShare,
                    isBulkShareProtected: event.isProtected,
                },
            )
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

    updateListsForAnnotation: EventHandler<
        'updateListsForAnnotation'
    > = async ({ event, previousState }) => {
        this.emitMutation({ confirmSelectNoteSpaceArgs: { $set: null } })

        this.updateAnnotationFollowedLists(event.annotationId, previousState, {
            add: event.added != null ? [event.added] : [],
            remove: event.deleted != null ? [event.deleted] : [],
        })

        await this.options.annotationsCache.updateLists({
            annotationId: event.annotationId,
            options: event.options,
            deleted: event.deleted,
            added: event.added,
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
    updateNewPageCommentLists: EventHandler<
        'updateNewPageCommentLists'
    > = async ({ event, previousState }) => {
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
        const annotationIndex = previousState.annotations.findIndex(
            (annot) => annot.url === event.annotationUrl,
        )
        if (annotationIndex === -1) {
            return
        }
        const existing = previousState.annotations[annotationIndex]

        // If the main save button was pressed, then we're not changing any share state, thus keep the old lists
        // NOTE: this distinction exists because of the SAS state being implicit and the logic otherwise thinking you want
        //  to make a SAS annotation private protected upon save btn press
        existing.lists = event.mainBtnPressed
            ? existing.lists
            : this.getAnnotListsAfterShareStateChange({
                  previousState,
                  annotationIndex,
                  keepListsIfUnsharing: event.keepListsIfUnsharing,
                  incomingPrivacyState: {
                      public: event.shouldShare,
                      protected: !!event.isProtected,
                  },
              })

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
            confirmPrivatizeNoteArgs: {
                $set: null,
            },
            ...this.applyStateMutationForAllFollowedLists(previousState, {
                annotationModes: {
                    [event.annotationUrl]: { $set: 'default' },
                },
            }),
        })

        await this.options.annotationsCache.update(
            {
                ...existing,
                comment,
                tags: form.tags,
            },
            {
                shouldShare: event.shouldShare,
                shouldCopyShareLink: event.shouldShare,
                isBulkShareProtected:
                    event.isProtected || !!event.keepListsIfUnsharing,
                skipBackendListUpdateOp: true,
                keepListsIfUnsharing: event.keepListsIfUnsharing,
                skipPrivacyLevelUpdate: event.mainBtnPressed,
            },
        )
    }

    deleteAnnotation: EventHandler<'deleteAnnotation'> = async ({
        event,
        previousState,
    }) => {
        const { annotationsCache } = this.options
        const annotation = annotationsCache.getAnnotationById(
            event.annotationUrl,
        )

        this.removeAnnotationFromAllFollowedLists(
            event.annotationUrl,
            previousState,
        )
        await annotationsCache.delete(annotation)
    }

    private updateAnnotationFollowedLists(
        localAnnotationId: string,
        previousState: SidebarContainerState,
        listUpdates: {
            add: number[]
            remove: number[]
        },
    ) {
        const followedAnnotId = this.options.annotationsCache.getAnnotationById(
            localAnnotationId,
        )?.remoteId

        if (followedAnnotId == null) {
            return
        }

        // Resolve local list IDs to remote (or calc lists to remove/add to, if not explicitly given)
        const localListIdToRemoteData = (localListId: number) =>
            this.options.annotationsCache.listData[localListId]

        const addTo = listUpdates.add
            .map(localListIdToRemoteData)
            .filter((a) => a != null)

        const removeFrom = listUpdates.remove
            .map(localListIdToRemoteData)
            .filter((a) => a != null)

        this.emitMutation({
            followedLists: {
                allIds: {
                    $apply: (ids: string[]): string[] => {
                        const idSet = new Set(ids)
                        addTo.forEach((data) => idSet.add(data.remoteId))
                        removeFrom.forEach((data) => {
                            if (
                                previousState.followedLists.byId[data.remoteId]
                                    ?.sharedAnnotationReferences.length <= 1
                            ) {
                                idSet.delete(data.remoteId)
                            }
                        })
                        return [...idSet]
                    },
                },
                byId: {
                    ...removeFrom.reduce(
                        (acc, { remoteId }) => ({
                            ...acc,
                            ...(previousState.followedLists.byId[remoteId]
                                ?.sharedAnnotationReferences.length > 1
                                ? {
                                      [remoteId]: {
                                          sharedAnnotationReferences: {
                                              $apply: (
                                                  refs: SharedAnnotationReference[],
                                              ) =>
                                                  refs.filter(
                                                      (ref) =>
                                                          ref.id !==
                                                          followedAnnotId,
                                                  ),
                                          },
                                      },
                                  }
                                : {
                                      $unset: [remoteId],
                                  }),
                        }),
                        {},
                    ),
                    ...addTo.reduce(
                        (acc, { name, remoteId }) => ({
                            ...acc,
                            [remoteId]:
                                previousState.followedLists.byId[remoteId] !=
                                null
                                    ? {
                                          sharedAnnotationReferences: {
                                              $push: [
                                                  {
                                                      type:
                                                          'shared-annotation-reference',
                                                      id: followedAnnotId,
                                                  },
                                              ],
                                          },
                                      }
                                    : {
                                          $set: this.createdFollowedListState({
                                              name,
                                              id: remoteId,
                                              sharedAnnotationReferences: [
                                                  {
                                                      type:
                                                          'shared-annotation-reference',
                                                      id: followedAnnotId,
                                                  },
                                              ],
                                          }),
                                      },
                        }),
                        {},
                    ),
                },
            },
        })
    }

    private removeAnnotationFromAllFollowedLists(
        localAnnotationId: string,
        previousState: SidebarContainerState,
    ) {
        const followedAnnotId = this.options.annotationsCache.getAnnotationById(
            localAnnotationId,
        )?.remoteId

        if (followedAnnotId == null) {
            return
        }

        const removeFrom = previousState.followedLists.allIds.filter((listId) =>
            previousState.followedLists.byId[
                listId
            ]?.sharedAnnotationReferences.find(
                (ref) => ref.id === followedAnnotId,
            ),
        )

        this.emitMutation({
            followedAnnotations: { $unset: [followedAnnotId] },
            followedLists: {
                byId: removeFrom.reduce(
                    (acc, listId) => ({
                        ...acc,
                        [listId]: {
                            sharedAnnotationReferences: {
                                $apply: (refs: SharedAnnotationReference[]) =>
                                    refs.filter(
                                        (ref) => ref.id !== followedAnnotId,
                                    ),
                            },
                        },
                    }),
                    {},
                ),
            },
        })
    }

    shareAnnotation: EventHandler<'shareAnnotation'> = async ({ event }) => {
        if (!(await this.ensureLoggedIn())) {
            return
        }

        const mutation: UIMutation<SidebarContainerState> =
            event.followedListId != null
                ? {
                      followedLists: {
                          byId: {
                              [event.followedListId]: {
                                  activeShareMenuAnnotationId: {
                                      $set: event.annotationUrl,
                                  },
                              },
                          },
                      },
                  }
                : {
                      activeShareMenuNoteId: { $set: event.annotationUrl },
                  }

        if (navigator.platform === 'MacIntel') {
            const immediateShare =
                event.mouseEvent.metaKey && event.mouseEvent.altKey
            this.emitMutation({
                ...mutation,
                immediatelyShareNotes: { $set: !!immediateShare },
            })
        } else {
            const immediateShare =
                event.mouseEvent.ctrlKey && event.mouseEvent.altKey
            this.emitMutation({
                ...mutation,
                immediatelyShareNotes: { $set: !!immediateShare },
            })
        }

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

        const mutation: UIMutation<SidebarContainerState> =
            event.followedListId != null
                ? {
                      followedLists: {
                          byId: {
                              [event.followedListId]: {
                                  annotationModes: {
                                      [event.annotationUrl]: { $set: 'edit' },
                                  },
                              },
                          },
                      },
                  }
                : {
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
        previousState,
    }) => {
        if (event.followedListId != null) {
            this.emitMutation({
                followedLists: {
                    byId: {
                        [event.followedListId]: {
                            annotationModes: {
                                [event.annotationUrl]: {
                                    $set: event.mode,
                                },
                            },
                        },
                    },
                },
            })
        } else {
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
        const { customLists, pageUrl, annotationsCache } = this.options

        await executeUITask(this, 'followedListLoadState', async () => {
            const followedLists = await customLists.fetchFollowedListsWithAnnotations(
                {
                    normalizedPageUrl: normalizeUrl(
                        previousState.pageUrl ?? pageUrl,
                    ),
                },
            )

            // TODO: Make this work (if needed)
            // const areListsContributable = fromPairs(
            //     await Promise.all(
            //         followedLists.map(async (list) => {
            //             const canWrite = await contentSharing.canWriteToSharedListRemoteId(
            //                 {
            //                     remoteId: list.id,
            //                 },
            //             )
            //             return [list.id, canWrite]
            //         }),
            //     ),
            // )

            this.emitMutation({
                followedLists: {
                    allIds: {
                        $set: followedLists.map((list) => list.id),
                    },
                    byId: {
                        $set: fromPairs(
                            followedLists.map((list) => [
                                list.id,
                                this.createdFollowedListState(list),
                            ]),
                        ),
                    },
                },
            })
        })
    }

    private createdFollowedListState = (
        list: SharedAnnotationList,
    ): FollowedListState => {
        const initAnnotStates = (initValue: any) =>
            list.sharedAnnotationReferences.reduce((acc, ref) => {
                const localAnnot = this.options.annotationsCache.getAnnotationByRemoteId(
                    ref.id,
                )
                if (!localAnnot) {
                    return acc
                }
                return {
                    ...acc,
                    [localAnnot.url]: initValue,
                }
            }, {})

        return {
            ...list,
            isExpanded: false,
            isContributable: false,
            annotationsLoadState: 'pristine',
            conversationsLoadState: 'pristine',
            activeCopyPasterAnnotationId: undefined,
            activeListPickerAnnotationId: undefined,
            activeShareMenuAnnotationId: undefined,
            annotationModes: initAnnotStates('default'),
            annotationEditForms: initAnnotStates({ ...INIT_FORM_STATE }),
        }
    }

    expandMyNotes: EventHandler<'expandMyNotes'> = async ({
        event,
        previousState,
    }) => {
        const { isExpanded: wasExpanded, annotations } = previousState

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

        await this.afterToggleListView(
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
        const {
            annotations,
            auth: authBG,
            annotationsCache,
            contentConversationsBG,
        } = this.options
        const { sharedAnnotationReferences } = previousState.followedLists.byId[
            event.listId
        ]
        this.emitMutation({
            conversations: {
                $merge: getInitialAnnotationConversationStates(
                    sharedAnnotationReferences.map(({ id }) => ({
                        linkId: id.toString(),
                    })),
                    (annotationId) => `${event.listId}:${annotationId}`,
                ),
            },
        })

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
                const [currentUser, sharedAnnotations] = await Promise.all([
                    authBG.getCurrentUser(),
                    annotations.getSharedAnnotations({
                        sharedAnnotationReferences,
                        withCreatorData: true,
                    }),
                ])

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
                                    localId:
                                        annot.creatorReference.id ===
                                        currentUser.id
                                            ? annotationsCache.getAnnotationByRemoteId(
                                                  annot.reference.id,
                                              )?.url ?? null
                                            : null,
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
                    buildConversationId,
                    annotationReferences: sharedAnnotationReferences,
                    sharedListReference: {
                        type: 'shared-list-reference',
                        id: event.listId,
                    },
                    getThreadsForAnnotations: ({
                        annotationReferences,
                        sharedListReference,
                    }) =>
                        contentConversationsBG.getThreadsForSharedAnnotations({
                            sharedAnnotationReferences: annotationReferences,
                            sharedListReference,
                        }),
                }),
        )
    }

    setAnnotationShareModalShown: EventHandler<
        'setAnnotationShareModalShown'
    > = ({ event }) => {
        this.emitMutation({ showAnnotationsShareModal: { $set: event.shown } })
    }

    setPrivatizeNoteConfirmArgs: EventHandler<
        'setPrivatizeNoteConfirmArgs'
    > = ({ event }) => {
        this.emitMutation({ confirmPrivatizeNoteArgs: { $set: event } })
    }

    setSelectNoteSpaceConfirmArgs: EventHandler<
        'setSelectNoteSpaceConfirmArgs'
    > = ({ event }) => {
        this.emitMutation({ confirmSelectNoteSpaceArgs: { $set: event } })
    }

    updateAllAnnotationsShareInfo: EventHandler<
        'updateAllAnnotationsShareInfo'
    > = ({ event }) => {
        const { annotationsCache } = this.options

        const nextAnnotations = annotationsCache.annotations.map(
            (annotation) => {
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
            },
        )

        annotationsCache.setAnnotations(nextAnnotations)
    }

    updateAnnotationShareInfo: EventHandler<
        'updateAnnotationShareInfo'
    > = async ({ previousState, event }) => {
        const annotationIndex = previousState.annotations.findIndex(
            (a) => a.url === event.annotationUrl,
        )
        if (annotationIndex === -1) {
            return
        }
        const privacyState = getAnnotationPrivacyState(event.privacyLevel)
        const existing = previousState.annotations[annotationIndex]
        const oldLists = [...existing.lists]

        existing.lists = this.getAnnotListsAfterShareStateChange({
            previousState,
            annotationIndex,
            incomingPrivacyState: privacyState,
            keepListsIfUnsharing: event.keepListsIfUnsharing,
        })

        if (!event.keepListsIfUnsharing) {
            const makingPublic = [
                AnnotationPrivacyLevels.SHARED,
                AnnotationPrivacyLevels.SHARED_PROTECTED,
            ].includes(event.privacyLevel)

            if (makingPublic) {
                this.updateAnnotationFollowedLists(
                    event.annotationUrl,
                    previousState,
                    {
                        add: existing.lists.filter(
                            (listId) => !oldLists.includes(listId),
                        ),
                        remove: oldLists.filter(
                            (listId) => !existing.lists.includes(listId),
                        ),
                    },
                )
            } else {
                this.removeAnnotationFromAllFollowedLists(
                    event.annotationUrl,
                    previousState,
                )
            }
        }

        await this.options.annotationsCache.update(existing, {
            isBulkShareProtected:
                privacyState.protected || !!event.keepListsIfUnsharing,
            shouldShare: privacyState.public,
            skipBackendOps: true, // Doing this so as the SingleNoteShareMenu logic will take care of the actual backend updates - we just want UI state updates
        })
    }

    private getAnnotListsAfterShareStateChange(params: {
        previousState: SidebarContainerState
        annotationIndex: number
        incomingPrivacyState: AnnotationPrivacyState
        keepListsIfUnsharing?: boolean
    }): number[] {
        const { annotationsCache } = this.options
        const existing =
            params.previousState.annotations[params.annotationIndex]

        const willUnshare =
            !params.incomingPrivacyState.public &&
            (existing.isShared || !params.incomingPrivacyState.protected)
        const selectivelySharedToPrivateProtected =
            !existing.isShared &&
            existing.isBulkShareProtected &&
            !params.incomingPrivacyState.public &&
            params.incomingPrivacyState.protected

        // If the note is being made private, we need to remove all shared lists (private remain)
        if (
            (willUnshare && !params.keepListsIfUnsharing) ||
            selectivelySharedToPrivateProtected
        ) {
            return existing.lists.filter(
                (listId) => annotationsCache.listData[listId]?.remoteId == null,
            )
        }
        if (!existing.isShared && params.incomingPrivacyState.public) {
            const privateLists = params.previousState.annotations[
                params.annotationIndex
            ].lists.filter(
                (listId) => annotationsCache.listData[listId]?.remoteId == null,
            )
            return [
                ...annotationsCache.parentPageSharedListIds,
                ...privateLists,
            ]
        }

        return existing.lists
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
