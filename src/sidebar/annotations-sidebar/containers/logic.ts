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
import type { Annotation } from 'src/annotations/types'
import type {
    SidebarContainerDependencies,
    SidebarContainerState,
    SidebarContainerEvents,
    EditForm,
    AnnotationCardInstanceEvent,
} from './types'
import type { AnnotationsSidebarInPageEventEmitter } from '../types'
import { DEF_RESULT_LIMIT } from '../constants'
import {
    generateAnnotationUrl,
    shareOptsToPrivacyLvl,
} from 'src/annotations/utils'
import { FocusableComponent } from 'src/annotations/components/types'
import {
    initNormalizedState,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { getAnnotationPrivacyState } from '@worldbrain/memex-common/lib/content-sharing/utils'
import { SIDEBAR_WIDTH_STORAGE_KEY } from '../constants'
import { getInitialAnnotationConversationStates } from '@worldbrain/memex-common/lib/content-conversations/ui/utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { resolvablePromise } from 'src/util/promises'
import { toInteger } from 'lodash'
import type {
    PageAnnotationsCacheInterface,
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import * as cacheUtils from 'src/annotations/cache/utils'
import {
    createAnnotation,
    updateAnnotation,
} from 'src/annotations/annotation-save-logic'
import {
    generateAnnotationCardInstanceId,
    initAnnotationCardInstance,
    initListInstance,
} from './utils'
import { browser, Storage } from 'webextension-polyfill-ts'

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
    commentText: '',
    lists: [],
}

export const createEditFormsForAnnotations = (annots: Annotation[]) => {
    const state: { [annotationUrl: string]: EditForm } = {}
    for (const annot of annots) {
        state[annot.url] = { ...INIT_FORM_STATE }
    }
    return state
}

const getAnnotCardInstanceId = <T = any>(
    e: AnnotationCardInstanceEvent<T>,
): string =>
    generateAnnotationCardInstanceId(
        { unifiedId: e.unifiedAnnotationId },
        e.instanceLocation,
    )

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
                        const annotation = options.annotationsCache.getAnnotationByRemoteId(
                            reference.id.toString(),
                        )
                        if (!annotation) {
                            return null
                        }
                        return {
                            pageCreatorReference: annotation.creator,
                            normalizedPageUrl: normalizeUrl(
                                state.pageUrl ?? options.fullPageUrl,
                            ),
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

            activeTab: 'annotations',

            loadState: 'pristine',
            cacheLoadState: 'pristine',
            noteCreateState: 'pristine',
            secondarySearchState: 'pristine',
            remoteAnnotationsLoadState: 'pristine',

            users: {},
            pillVisibility: 'unhover',

            isWidthLocked: false,
            isLocked: false,
            pageUrl: this.options.fullPageUrl,
            showState: 'hidden',
            annotationSharingAccess: 'sharing-allowed',
            readingView: false,
            showAllNotesCopyPaster: false,

            selectedListId: null,

            commentBox: { ...INIT_FORM_STATE },

            listInstances: {},
            annotationCardInstances: {},

            annotations: initNormalizedState(),
            lists: initNormalizedState(),

            activeAnnotationId: null, // TODO: make unified ID

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
            popoutsActive: false,
            showAllNotesShareMenu: false,
            activeShareMenuNoteId: undefined,
            immediatelyShareNotes: false,
        }
    }

    private async hydrateAnnotationsCache(fullPageUrl: string) {
        await executeUITask(this, 'cacheLoadState', async () =>
            cacheUtils.hydrateCache({
                fullPageUrl,
                user: this.options.currentUser,
                cache: this.options.annotationsCache,
                bgModules: {
                    annotations: this.options.annotations,
                    customLists: this.options.customLists,
                    contentSharing: this.options.contentSharing,
                    pageActivityIndicator: this.options.pageActivityIndicatorBG,
                },
            }),
        )
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const { fullPageUrl, annotationsCache, initialState } = this.options
        annotationsCache.events.addListener(
            'newAnnotationsState',
            this.annotationsSubscription,
        )
        annotationsCache.events.addListener(
            'newListsState',
            this.listsSubscription,
        )

        // Set initial state, based on what's in the cache (assuming it already has been hydrated)
        this.annotationsSubscription(annotationsCache.annotations)
        this.listsSubscription(annotationsCache.lists)
        await browser.storage.local.set({ '@Sidebar-reading_view': false })
        this.readingViewStorageListener(true)

        await loadInitial<SidebarContainerState>(this, async () => {
            const areTagsMigrated = await this.syncSettings.extension.get(
                'areTagsMigratedToSpaces',
            )
            this.emitMutation({
                shouldShowTagsUIs: { $set: !areTagsMigrated },
                showState: { $set: initialState ?? 'hidden' },
            })

            // If `pageUrl` prop passed down rehydrate cache
            if (fullPageUrl != null) {
                await this.hydrateAnnotationsCache(fullPageUrl)
            }
        })
        this.annotationsLoadComplete.resolve()
    }

    cleanup = () => {
        this.options.annotationsCache.events.removeListener(
            'newAnnotationsState',
            this.annotationsSubscription,
        )
        this.options.annotationsCache.events.removeListener(
            'newListsState',
            this.listsSubscription,
        )
    }

    private listsSubscription = (
        nextLists: PageAnnotationsCacheInterface['lists'],
    ) => {
        this.emitMutation({
            lists: { $set: nextLists },
            listInstances: {
                $set: fromPairs(
                    normalizedStateToArray(nextLists).map((list) => [
                        list.unifiedId,
                        initListInstance(list),
                    ]),
                ),
            },
        })
    }

    private annotationsSubscription = (
        nextAnnotations: PageAnnotationsCacheInterface['annotations'],
    ) => {
        this.emitMutation({
            noteCreateState: { $set: 'success' },
            annotations: { $set: nextAnnotations },
            annotationCardInstances: {
                $set: fromPairs(
                    normalizedStateToArray(nextAnnotations)
                        .map((annot) => [
                            ...annot.unifiedListIds.map((unifiedListId) => [
                                generateAnnotationCardInstanceId(
                                    annot,
                                    unifiedListId,
                                ),
                                initAnnotationCardInstance(annot),
                            ]),
                            [
                                generateAnnotationCardInstanceId(annot),
                                initAnnotationCardInstance(annot),
                            ],
                        ])
                        .flat(),
                ),
            },
        })
    }

    readingViewStorageListener = async (enable) => {
        if (enable) {
            await browser.storage.onChanged.addListener(this.toggleReadingView)
        } else {
            await browser.storage.local.set({ '@Sidebar-reading_view': false })
            await browser.storage.onChanged.removeListener(
                this.toggleReadingView,
            )
        }
    }

    toggleReadingView = (changes: Storage.StorageChange) => {
        for (let key of Object.entries(changes)) {
            if (key[0] === '@Sidebar-reading_view') {
                this.emitMutation({
                    readingView: { $set: key[1].newValue },
                })
            }
        }
    }

    sortAnnotations: EventHandler<'sortAnnotations'> = ({
        event: { sortingFn },
    }) => this.options.annotationsCache.sortAnnotations(sortingFn)

    private async ensureLoggedIn(): Promise<boolean> {
        const {
            auth,
            setLoginModalShown,
            setDisplayNameModalShown,
        } = this.options

        const user = await auth.getCurrentUser()
        if (user != null) {
            if (!user.displayName?.length) {
                const userProfile = await auth.getUserProfile()
                if (!userProfile?.displayName?.length) {
                    setDisplayNameModalShown?.(true)
                    this.emitMutation({
                        showDisplayNameSetupModal: { $set: true },
                    })
                    return false
                }
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

    adjustSidebarWidth: EventHandler<'adjustSidebarWidth'> = ({ event }) => {
        this.emitMutation({ sidebarWidth: { $set: event.newWidth } })

        if (event.isWidthLocked) {
            let SidebarWidth = toInteger(event.newWidth.replace('px', ''))
            let windowWidth = window.innerWidth
            let width = (windowWidth - SidebarWidth).toString()
            width = width + 'px'
            document.body.style.width = width
        }
    }

    setPopoutsActive: EventHandler<'setPopoutsActive'> = async ({ event }) => {
        this.emitMutation({
            popoutsActive: { $set: event },
        })
    }

    show: EventHandler<'show'> = async ({ event }) => {
        this.readingViewStorageListener(true)
        const width =
            event.existingWidthState != null
                ? event.existingWidthState
                : SIDEBAR_WIDTH_STORAGE_KEY

        this.emitMutation({
            showState: { $set: 'visible' },
            sidebarWidth: { $set: width },
        })
    }

    hide: EventHandler<'hide'> = ({ event, previousState }) => {
        this.readingViewStorageListener(false)
        this.emitMutation({
            showState: { $set: 'hidden' },
            activeAnnotationId: { $set: null },
        })

        document.body.style.width = 'initial'
    }

    lock: EventHandler<'lock'> = () =>
        this.emitMutation({ isLocked: { $set: true } })
    unlock: EventHandler<'unlock'> = () =>
        this.emitMutation({ isLocked: { $set: false } })

    lockWidth: EventHandler<'lockWidth'> = () => {
        // getLocalStorage(SIDEBAR_WIDTH_STORAGE_KEY).then((width) => {
        this.emitMutation({ isWidthLocked: { $set: true } })
    }

    unlockWidth: EventHandler<'unlockWidth'> = () => {
        document.body.style.width = '100%'
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

    setPillVisibility: EventHandler<'setPillVisibility'> = async ({
        event,
    }) => {
        this.emitMutation({
            pillVisibility: { $set: event.value },
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

        // await this.doSearch(nextState, { overwrite: false })
    }

    setPageUrl: EventHandler<'setPageUrl'> = async ({
        previousState,
        event,
    }) => {
        if (!isFullUrl(event.pageUrl)) {
            throw new Error(
                'Tried to set annotation sidebar with a normalized page URL',
            )
        }

        if (previousState.pageUrl === event.pageUrl) {
            return
        }

        const mutation: UIMutation<SidebarContainerState> = {
            pageUrl: { $set: event.pageUrl },
        }

        this.emitMutation(mutation)
        await this.hydrateAnnotationsCache(event.pageUrl)

        if (event.rerenderHighlights) {
            this.options.events?.emit('renderHighlights', {
                highlights: this.options.annotationsCache.highlights,
            })
        }
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
        })
    }

    // TODO: type properly
    private applyStateMutationForAllFollowedLists = (
        previousState: SidebarContainerState,
        mutation: UIMutation<any>,
    ): UIMutation<any> => ({
        // followedLists: {
        //     byId: previousState.followedLists.allIds.reduce(
        //         (acc, listId) => ({
        //             ...acc,
        //             [listId]: { ...mutation },
        //         }),
        //         {},
        //     ),
        // },
    })

    /* -- START: Annotation card instance events -- */
    setAnnotationEditMode: EventHandler<'setAnnotationEditMode'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationCardInstances: {
                [getAnnotCardInstanceId(event)]: {
                    isCommentEditing: { $set: event.isEditing },
                },
            },
        })
    }

    setAnnotationEditCommentText: EventHandler<
        'setAnnotationEditCommentText'
    > = ({ event }) => {
        this.emitMutation({
            annotationCardInstances: {
                [getAnnotCardInstanceId(event)]: {
                    comment: { $set: event.comment },
                },
            },
        })
    }

    setAnnotationCommentMode: EventHandler<'setAnnotationCommentMode'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationCardInstances: {
                [getAnnotCardInstanceId(event)]: {
                    isCommentTruncated: { $set: event.isTruncated },
                },
            },
        })
    }

    setAnnotationCardMode: EventHandler<'setAnnotationCardMode'> = ({
        event,
    }) => {
        this.emitMutation({
            annotationCardInstances: {
                [getAnnotCardInstanceId(event)]: {
                    cardMode: { $set: event.mode },
                },
            },
        })
    }

    editAnnotation: EventHandler<'editAnnotation'> = async ({
        event,
        previousState,
    }) => {
        const cardId = getAnnotCardInstanceId(event)
        const {
            annotationCardInstances: { [cardId]: formData },
            annotations: {
                byId: { [event.unifiedAnnotationId]: annotationData },
            },
        } = previousState

        if (
            !formData ||
            annotationData?.creator?.id !== this.options.currentUser?.id ||
            (event.shouldShare && !(await this.ensureLoggedIn()))
        ) {
            return
        }

        const now = event.now ?? Date.now()
        const comment = formData.comment.trim()
        const hasCoreAnnotChanged = comment !== annotationData.comment

        // If the main save button was pressed, then we're not changing any share state, thus keep the old lists
        // NOTE: this distinction exists because of the SAS state being implicit and the logic otherwise thinking you want
        //  to make a SAS annotation private protected upon save btn press
        // TODO: properly update lists state
        // existing.lists = event.mainBtnPressed
        //     ? existing.lists
        //     : this.getAnnotListsAfterShareStateChange({
        //           previousState,
        //           annotationIndex,
        //           keepListsIfUnsharing: event.keepListsIfUnsharing,
        //           incomingPrivacyState: {
        //               public: event.shouldShare,
        //               protected: !!event.isProtected,
        //           },
        //       })

        this.emitMutation({
            annotationCardInstances: {
                [cardId]: {
                    isCommentEditing: { $set: false },
                },
            },
            confirmPrivatizeNoteArgs: {
                $set: null,
            },
        })

        const { remoteAnnotationId, savePromise } = await updateAnnotation({
            annotationsBG: this.options.annotations,
            contentSharingBG: this.options.contentSharing,
            keepListsIfUnsharing: event.keepListsIfUnsharing,
            annotationData: {
                comment: comment !== annotationData.comment ? comment : null,
                localId: annotationData.localId,
            },
            shareOpts: {
                shouldShare: event.shouldShare,
                shouldCopyShareLink: event.shouldShare,
                isBulkShareProtected:
                    event.isProtected || !!event.keepListsIfUnsharing,
                skipPrivacyLevelUpdate: event.mainBtnPressed,
            },
        })

        this.options.annotationsCache.updateAnnotation(
            {
                ...annotationData,
                comment,
                remoteId: remoteAnnotationId ?? undefined,
                privacyLevel: shareOptsToPrivacyLvl({
                    shouldShare: event.shouldShare,
                    isBulkShareProtected:
                        event.isProtected || !!event.keepListsIfUnsharing,
                }),
            },
            { updateLastEditedTimestamp: hasCoreAnnotChanged, now },
        )

        await savePromise
    }
    /* -- END: Annotation card instance events -- */

    receiveSharingAccessChange: EventHandler<'receiveSharingAccessChange'> = ({
        event: { sharingAccess },
    }) => {
        this.emitMutation({ annotationSharingAccess: { $set: sharingAccess } })
    }

    cancelNewPageNote: EventHandler<'cancelNewPageNote'> = () => {
        this.emitMutation({
            commentBox: { $set: INIT_FORM_STATE },
            showCommentBox: { $set: false },
        })
    }

    setNewPageNoteText: EventHandler<'setNewPageNoteText'> = async ({
        event,
    }) => {
        if (event.comment.length) {
            this.emitMutation({
                showCommentBox: { $set: true },
                commentBox: {
                    commentText: { $set: event.comment },
                },
            })
        }

        this.options.focusCreateForm()
    }

    saveNewPageNote: EventHandler<'saveNewPageNote'> = async ({
        event,
        previousState,
    }) => {
        const {
            lists,
            pageUrl,
            commentBox,
            selectedListId: selectedList,
        } = previousState
        const comment = commentBox.commentText.trim()
        if (comment.length === 0) {
            return
        }
        const now = event.now ?? Date.now()
        const annotationId = generateAnnotationUrl({
            pageUrl,
            now: () => now,
        })

        this.emitMutation({
            commentBox: { $set: INIT_FORM_STATE },
            showCommentBox: { $set: false },
        })

        await executeUITask(this, 'noteCreateState', async () => {
            if (event.shouldShare && !(await this.ensureLoggedIn())) {
                return
            }

            const listIds = [...commentBox.lists]
            if (selectedList != null) {
                const { localId } = lists.byId[selectedList]
                listIds.push(localId)
            }

            const { remoteAnnotationId, savePromise } = await createAnnotation({
                annotationData: {
                    fullPageUrl: pageUrl,
                    comment,
                    localId: annotationId,
                    createdWhen: new Date(now),
                },
                annotationsBG: this.options.annotations,
                contentSharingBG: this.options.contentSharing,
                shareOpts: {
                    shouldShare: event.shouldShare,
                    shouldCopyShareLink: event.shouldShare,
                    isBulkShareProtected: event.isProtected,
                },
            })

            this.options.annotationsCache.addAnnotation({
                localId: annotationId,
                remoteId: remoteAnnotationId ?? undefined,
                normalizedPageUrl: normalizeUrl(pageUrl),
                privacyLevel: shareOptsToPrivacyLvl({
                    shouldShare: event.shouldShare,
                    isBulkShareProtected: event.isProtected,
                }),
                creator: this.options.currentUser,
                localListIds: listIds,
                createdWhen: now,
                lastEdited: now,
                comment,
            })

            await savePromise

            // TODO: Share annot to lists (maybe updated createAnnotation method)
        })
    }

    updateListsForAnnotation: EventHandler<
        'updateListsForAnnotation'
    > = async ({ event, previousState }) => {
        this.emitMutation({ confirmSelectNoteSpaceArgs: { $set: null } })

        // TODO: proeprly map lists here
        // this.options.annotationsCache.updateAnnotation({
        //     unifiedId: event.unifiedAnnotationId,

        // })
    }

    setNewPageNoteLists: EventHandler<'setNewPageNoteLists'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            commentBox: { lists: { $set: event.lists } },
        })
    }

    __setActiveAnnotationUrl: EventHandler<
        '__setActiveAnnotationUrl'
    > = async ({ event, previousState }) => {
        // const annotation = previousState.annotations.find(
        //     (annot) => annot.url === event.annotationUrl,
        // )
        // if (annotation != null) {
        //     this.options.events?.emit('highlightAndScroll', { annotation })
        // }
        // this.emitMutation({
        //     activeAnnotationUrl: { $set: event.annotationUrl },
        // })
    }

    goToAnnotationInNewTab: EventHandler<'goToAnnotationInNewTab'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            activeAnnotationId: { $set: event.annotationUrl },
        })

        const annotation = this.options.annotationsCache.getAnnotationByLocalId(
            event.annotationUrl,
        )
        if (!annotation) {
            throw new Error(
                `Could not find cached annotation data for ID: ${event.annotationUrl}`,
            )
        }

        return this.options.annotations.goToAnnotationFromSidebar({
            url: annotation.normalizedPageUrl,
            annotation: { url: annotation.localId },
        })
    }

    deleteAnnotation: EventHandler<'deleteAnnotation'> = async ({ event }) => {
        const { annotationsCache, annotations: annotationsBG } = this.options
        const existing =
            annotationsCache.annotations.byId[event.unifiedAnnotationId]
        annotationsCache.removeAnnotation({
            unifiedId: event.unifiedAnnotationId,
        })

        if (existing?.localId != null) {
            await annotationsBG.deleteAnnotation(existing.localId)
        }
    }

    setActiveAnnotation: EventHandler<'setActiveAnnotation'> = async ({
        event,
    }) => {
        this.emitMutation({
            activeAnnotationId: { $set: event.unifiedAnnotationId },
        })
    }

    shareAnnotation: EventHandler<'shareAnnotation'> = async ({ event }) => {
        if (!(await this.ensureLoggedIn())) {
            return
        }

        const mutation: UIMutation<SidebarContainerState> =
            event.followedListId != null
                ? {
                      //   followedLists: {
                      //       byId: {
                      //           [event.followedListId]: {
                      //               activeShareMenuAnnotationId: {
                      //                   $set: event.annotationUrl,
                      //               },
                      //           },
                      //       },
                      //   },
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

    setAnnotationsExpanded: EventHandler<'setAnnotationsExpanded'> = (
        incoming,
    ) => {}

    fetchSuggestedTags: EventHandler<'fetchSuggestedTags'> = (incoming) => {}

    fetchSuggestedDomains: EventHandler<'fetchSuggestedDomains'> = (
        incoming,
    ) => {}

    private async loadRemoteAnnotationReferencesForLists(
        state: SidebarContainerState,
        lists: UnifiedList[],
    ): Promise<SidebarContainerState> {
        if (!lists.length) {
            return
        }

        let nextState = state

        await executeUITask(
            this,
            (taskState) => ({
                listInstances: fromPairs(
                    lists.map((list) => [
                        list.unifiedId,
                        { annotationRefsLoadState: { $set: taskState } },
                    ]),
                ),
            }),
            async () => {
                const annotationRefsByList = await this.options.customLists.fetchAnnotationRefsForRemoteListsOnPage(
                    {
                        normalizedPageUrl: normalizeUrl(state.pageUrl),
                        sharedListIds: lists.map((list) => list.remoteId!),
                    },
                )

                const mutation: UIMutation<
                    SidebarContainerState['listInstances']
                > = {}

                for (const { unifiedId, remoteId } of lists) {
                    mutation[unifiedId] = {
                        sharedAnnotationReferences: {
                            $set: annotationRefsByList[remoteId] ?? [],
                        },
                    }
                }

                nextState = this.withMutation(nextState, {
                    listInstances: mutation,
                })
                this.emitMutation({ listInstances: mutation })
            },
        )
        return nextState
    }

    setActiveSidebarTab: EventHandler<'setActiveSidebarTab'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            activeTab: { $set: event.tab },
        })

        // Don't attempt to re-render highlights on the page if in selected-space mode
        if (previousState.selectedListId != null || event.tab === 'feed') {
            return
        }

        let highlights: UnifiedAnnotation[]
        if (event.tab === 'annotations') {
            highlights = this.options.annotationsCache.highlights
        } else if (event.tab === 'spaces') {
            // TODO: Work this out in new model
            // highlights = previousState.followedLists.allIds
            //     .filter((id) => previousState.followedLists.byId[id].isExpanded)
            //     .map(
            //         (id) =>
            //             previousState.followedLists.byId[id]
            //                 .sharedAnnotationReferences,
            //     )
            //     .flat()
            //     .map((ref) => ref.id.toString())
            //     .filter(
            //         (id) =>
            //             previousState.followedAnnotations[id]?.selector != null,
            //     )
            //     .map((id) => ({
            //         url: id,
            //         selector: previousState.followedAnnotations[id].selector,
            //     }))

            const listsWithRemoteAnnots = normalizedStateToArray(
                this.options.annotationsCache.lists,
            ).filter(
                (list) =>
                    list.hasRemoteAnnotations &&
                    list.remoteId != null &&
                    previousState.listInstances[list.unifiedId]
                        ?.annotationRefsLoadState === 'pristine', // Ensure it hasn't already been loaded
            )

            await this.loadRemoteAnnotationReferencesForLists(
                previousState,
                listsWithRemoteAnnots,
            )
        }

        if (highlights != null) {
            this.options.events?.emit('renderHighlights', { highlights })
        }
    }

    private async maybeLoadListRemoteAnnotations(
        state: SidebarContainerState,
        unifiedListId: UnifiedList['unifiedId'],
    ) {
        const list = state.lists.byId[unifiedListId]
        const listInstance = state.listInstances[unifiedListId]

        if (
            !list ||
            !listInstance ||
            listInstance.sharedAnnotationReferences == null ||
            listInstance.annotationsLoadState !== 'pristine' ||
            !list.hasRemoteAnnotations
        ) {
            return
        }

        await executeUITask(
            this,
            (taskState) => ({
                listInstances: {
                    [unifiedListId]: {
                        annotationsLoadState: { $set: taskState },
                    },
                },
            }),
            async () => {
                const sharedAnnotations = await this.options.annotations.getSharedAnnotations(
                    {
                        sharedAnnotationReferences:
                            listInstance.sharedAnnotationReferences,
                        withCreatorData: true,
                    },
                )

                const annotationCardInstances: SidebarContainerState['annotationCardInstances'] = {}
                for (const annot of sharedAnnotations) {
                    const {
                        unifiedId,
                    } = this.options.annotationsCache.addAnnotation(
                        cacheUtils.reshapeSharedAnnotationForCache(annot, {}),
                    )
                    annotationCardInstances[
                        generateAnnotationCardInstanceId(
                            { unifiedId },
                            unifiedListId,
                        )
                    ] = initAnnotationCardInstance({ unifiedId })
                }

                this.emitMutation({
                    annotationCardInstances: {
                        $merge: annotationCardInstances,
                    },
                })
            },
        )
    }

    expandListAnnotations: EventHandler<'expandListAnnotations'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            listInstances: {
                [event.unifiedListId]: {
                    isOpen: { $apply: (isOpen) => !isOpen },
                },
            },
        })

        await this.maybeLoadListRemoteAnnotations(
            previousState,
            event.unifiedListId,
        )
    }

    setSelectedList: EventHandler<'setSelectedList'> = async ({
        event,
        previousState,
    }) => {
        // TODO : this is a hack to stop users clicking on space pills before the followed lists have been loaded
        //  Because shit breaks down if they're not loaded and everything's too much of a mess to untangle right now.
        //  Should become much less of a problem once we load followed lists from local DB
        // if (previousState.followedListLoadState !== 'success') {
        //     return
        // }

        this.options.events?.emit('setSelectedList', event.unifiedListId)

        if (event.unifiedListId == null) {
            this.emitMutation({ selectedListId: { $set: null } })

            // this.options.events.emit('renderHighlights', {
            //     highlights: previousState.annotations,
            // })
            return
        }

        const list = previousState.lists.byId[event.unifiedListId]
        const listInstance = previousState.listInstances[event.unifiedListId]
        if (!list || !listInstance) {
            console.warn(
                'setSelectedList: could not find matching list for cache ID:',
                event.unifiedListId,
            )
            return
        }

        this.emitMutation({
            activeTab: { $set: 'spaces' },
            selectedListId: { $set: event.unifiedListId },
        })

        if (list.remoteId != null) {
            // this.options.events.emit('renderHighlights', {
            //     highlights: previousState.annotations.filter(({ lists }) =>
            //         lists.includes(localListId),
            //     ),
            // })
            let nextState = previousState
            if (listInstance.annotationRefsLoadState === 'pristine') {
                nextState = await this.loadRemoteAnnotationReferencesForLists(
                    previousState,
                    [list],
                )
            }
            await this.maybeLoadListRemoteAnnotations(
                nextState,
                event.unifiedListId,
            )
        }
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
        throw new Error('updated all share info not yet implemented')

        // const nextAnnotations = annotationsCache.annotations.map(
        //     (annotation) => {
        //         const privacyState = getAnnotationPrivacyState(
        //             event[annotation.url].privacyLevel,
        //         )
        //         const nextAnnotation =
        //             event[annotation.url] == null
        //                 ? annotation
        //                 : {
        //                       ...annotation,
        //                       isShared: privacyState.public,
        //                       isBulkShareProtected: privacyState.protected,
        //                   }
        //         return nextAnnotation
        //     },
        // )

        // annotationsCache.setAnnotations(nextAnnotations)
    }

    updateAnnotationShareInfo: EventHandler<
        'updateAnnotationShareInfo'
    > = async ({ previousState, event }) => {
        // const annotationIndex = previousState.annotations.findIndex(
        //     (a) => a.url === event.annotationUrl,
        // )
        const annotationIndex = -1
        if (annotationIndex === -1) {
            return
        }
        const privacyState = getAnnotationPrivacyState(event.privacyLevel)
        const existing = previousState.annotations.byId[annotationIndex]
        const oldLists = [...existing.unifiedListIds]

        // existing.unifiedListIds= this.getAnnotListsAfterShareStateChange({
        //     previousState,
        //     annotationIndex,
        //     incomingPrivacyState: privacyState,
        //     keepListsIfUnsharing: event.keepListsIfUnsharing,
        // })

        if (!event.keepListsIfUnsharing) {
            const makingPublic = [
                AnnotationPrivacyLevels.SHARED,
                AnnotationPrivacyLevels.SHARED_PROTECTED,
            ].includes(event.privacyLevel)

            if (makingPublic) {
                // this.updateAnnotationFollowedLists(
                //     event.annotationUrl,
                //     previousState,
                //     {
                //         add: existing.unifiedListIds.filter(
                //             (listId) => !oldLists.includes(listId),
                //         ),
                //         remove: oldLists.filter(
                //             (listId) => !existing.unifiedListIds.includes(listId),
                //         ),
                //     },
                // )
            } else {
                // this.removeAnnotationFromAllFollowedLists(
                //     event.annotationUrl,
                //     previousState,
                // )
            }
        }

        await this.options.annotationsCache.updateAnnotation({
            ...existing,
            privacyLevel: shareOptsToPrivacyLvl({
                shouldShare: privacyState.public,
                isBulkShareProtected:
                    privacyState.protected || !!event.keepListsIfUnsharing,
            }),
            // skipBackendOps: true, // Doing this so as the SingleNoteShareMenu logic will take care of the actual backend updates - we just want UI state updates
        })
    }

    // private getAnnotListsAfterShareStateChange(params: {
    //     previousState: SidebarContainerState
    //     annotationIndex: number
    //     incomingPrivacyState: AnnotationPrivacyState
    //     keepListsIfUnsharing?: boolean
    // }): number[] {
    //     const { annotationsCache } = this.options
    //     const existing =
    //         params.previousState.annotations[params.annotationIndex]

    //     const willUnshare =
    //         !params.incomingPrivacyState.public &&
    //         (existing.isShared || !params.incomingPrivacyState.protected)
    //     const selectivelySharedToPrivateProtected =
    //         !existing.isShared &&
    //         existing.isBulkShareProtected &&
    //         !params.incomingPrivacyState.public &&
    //         params.incomingPrivacyState.protected

    //     // If the note is being made private, we need to remove all shared lists (private remain)
    //     if (
    //         (willUnshare && !params.keepListsIfUnsharing) ||
    //         selectivelySharedToPrivateProtected
    //     ) {
    //         return existing.lists.filter(
    //             (listId) => annotationsCache.listData[listId]?.remoteId == null,
    //         )
    //     }
    //     if (!existing.isShared && params.incomingPrivacyState.public) {
    //         const privateLists = params.previousState.annotations[
    //             params.annotationIndex
    //         ].lists.filter(
    //             (listId) => annotationsCache.listData[listId]?.remoteId == null,
    //         )
    //         return [
    //             ...annotationsCache.parentPageSharedListIds,
    //             ...privateLists,
    //         ]
    //     }

    //     return existing.lists
    // }

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
