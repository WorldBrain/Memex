import fromPairs from 'lodash/fromPairs'
import { isFullUrl, normalizeUrl } from '@worldbrain/memex-url-utils'
import browser from 'webextension-polyfill'
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
import { SIDEBAR_WIDTH_STORAGE_KEY } from '../constants'
import {
    getInitialAnnotationConversationState,
    getInitialAnnotationConversationStates,
} from '@worldbrain/memex-common/lib/content-conversations/ui/utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { resolvablePromise } from 'src/util/promises'
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
import type { AnnotationSharingState } from 'src/content-sharing/background/types'
import type { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import type { YoutubeService } from '@worldbrain/memex-common/lib/services/youtube'
import type { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import { SummarizationService } from '@worldbrain/memex-common/lib/summarization/index'
import { isUrlPDFViewerUrl } from 'src/pdf/util'
import type { Storage } from 'webextension-polyfill'
import throttle from 'lodash/throttle'
import {
    getRemoteEventEmitter,
    TypedRemoteEventEmitter,
} from 'src/util/webextensionRPC'

export type SidebarContainerOptions = SidebarContainerDependencies & {
    events?: AnnotationsSidebarInPageEventEmitter
}

export type SidebarLogicOptions = SidebarContainerOptions & {
    focusCreateForm: FocusableComponent['focus']
    focusEditNoteForm: (annotationId: string) => void
    setLoginModalShown?: (isShown: boolean) => void
    setDisplayNameModalShown?: (isShown: boolean) => void
    youtubePlayer?: YoutubePlayer
    youtubeService?: YoutubeService
}

type EventHandler<
    EventName extends keyof SidebarContainerEvents
> = UIEventHandler<SidebarContainerState, SidebarContainerEvents, EventName>

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
    resizeObserver
    sidebar
    readingViewState
    summarisePageEvents: TypedRemoteEventEmitter<'pageSummary'>

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
                    buildConversationId: this.buildConversationId,
                    loadUserByReference: options.authBG?.getUserByReference,
                    submitNewReply: options.contentConversationsBG.submitReply,
                    isAuthorizedToConverse: async () => true,
                    getCurrentUser: async () => {
                        const user = await options.authBG.getCurrentUser()
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
                                state.fullPageUrl ?? options.fullPageUrl,
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

            cacheLoadState: this.options.shouldHydrateCacheOnInit
                ? 'pristine'
                : 'success',
            loadState: 'running',
            noteCreateState: 'pristine',
            secondarySearchState: 'pristine',
            remoteAnnotationsLoadState: 'pristine',
            foreignSelectedListLoadState: 'pristine',

            users: {},
            pillVisibility: 'unhover',

            isWidthLocked: false,
            isLocked: false,
            fullPageUrl: this.options.fullPageUrl,
            showState: 'hidden',
            annotationSharingAccess: 'sharing-allowed',
            readingView: false,
            showAllNotesCopyPaster: false,
            pageSummary: undefined,
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
            pageHasNetworkAnnotations: false,
        }
    }

    private buildConversationId: ConversationIdBuilder = (
        remoteAnnotId,
        { id: remoteListId },
    ) => {
        const { annotationsCache } = this.options
        const cachedAnnotation = annotationsCache.getAnnotationByRemoteId(
            remoteAnnotId.toString(),
        )
        const cachedList = annotationsCache.getListByRemoteId(
            remoteListId.toString(),
        )

        return generateAnnotationCardInstanceId(
            cachedAnnotation,
            cachedList.unifiedId,
        )
    }

    private async hydrateAnnotationsCache(
        fullPageUrl: string,
        opts: { renderHighlights: boolean },
    ) {
        await executeUITask(this, 'cacheLoadState', async () => {
            await cacheUtils.hydrateCache({
                fullPageUrl,
                user: this.options.currentUser,
                cache: this.options.annotationsCache,
                bgModules: {
                    customLists: this.options.customListsBG,
                    annotations: this.options.annotationsBG,
                    contentSharing: this.options.contentSharingBG,
                    pageActivityIndicator: this.options.pageActivityIndicatorBG,
                },
            })
        })

        if (opts.renderHighlights) {
            this.renderOwnHighlights(this.options.annotationsCache)
        }
    }

    private renderOwnHighlights = ({
        annotations,
    }: Pick<SidebarContainerState, 'annotations'>) => {
        const highlights = cacheUtils.getUserHighlightsArray(
            { annotations },
            this.options.currentUser?.id.toString(),
        )
        this.options.events?.emit('renderHighlights', {
            highlights,
        })
    }

    private renderOpenSpaceInstanceHighlights = ({
        annotations,
        listInstances,
        lists,
    }: Pick<
        SidebarContainerState,
        'annotations' | 'lists' | 'listInstances'
    >) => {
        const highlights = Object.values(listInstances)
            .filter((instance) => instance.isOpen)
            .map(
                (instance) =>
                    lists.byId[instance.unifiedListId]?.unifiedAnnotationIds ??
                    [],
            )
            .flat()
            .map((unifiedAnnotId) => annotations.byId[unifiedAnnotId])
            .filter((annot) => annot.body?.length > 0 && annot.selector != null)

        this.options.events?.emit('renderHighlights', {
            highlights,
        })
    }

    private setupRemoteEventListeners() {
        this.summarisePageEvents = getRemoteEventEmitter('pageSummary')

        this.summarisePageEvents.on('newSummaryChunk', ({ chunk }) => {
            this.emitMutation({
                loadState: { $set: 'success' },
                pageSummary: { $apply: (prev) => prev + chunk },
            })
        })
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const {
            shouldHydrateCacheOnInit,
            pageActivityIndicatorBG,
            annotationsCache,
            initialState,
            fullPageUrl,
            storageAPI,
            runtimeAPI,
            summarizeBG,
        } = this.options
        annotationsCache.events.addListener(
            'newAnnotationsState',
            this.cacheAnnotationsSubscription,
        )
        annotationsCache.events.addListener(
            'newListsState',
            this.cacheListsSubscription,
        )
        this.setupRemoteEventListeners()
        // Set initial state, based on what's in the cache (assuming it already has been hydrated)
        this.cacheAnnotationsSubscription(annotationsCache.annotations)
        this.cacheListsSubscription(annotationsCache.lists)
        this.sidebar = document
            .getElementById('memex-sidebar-container')
            ?.shadowRoot.getElementById('annotationSidebarContainer')
        this.readingViewState =
            (await browser.storage.local.get('@Sidebar-reading_view')) ?? false
        // this.readingViewStorageListener(true)

        await loadInitial<SidebarContainerState>(this, async () => {
            this.emitMutation({
                showState: { $set: initialState ?? 'hidden' },
                loadState: { $set: 'running' },
            })

            if (initialState === 'visible') {
                this.readingViewStorageListener(true)
            }

            const hasNetworkActivity = await pageActivityIndicatorBG.getPageActivityStatus(
                fullPageUrl,
            )
            this.emitMutation({
                pageHasNetworkAnnotations: {
                    $set: hasNetworkActivity !== 'no-activity',
                },
            })

            if (shouldHydrateCacheOnInit && fullPageUrl != null) {
                await this.hydrateAnnotationsCache(fullPageUrl, {
                    renderHighlights: true,
                })
            }
        })
        this.annotationsLoadComplete.resolve()

        if (isUrlPDFViewerUrl(window.location.href, { runtimeAPI })) {
            const width = SIDEBAR_WIDTH_STORAGE_KEY

            this.emitMutation({
                showState: { $set: 'visible' },
                sidebarWidth: { $set: width },
            })

            setTimeout(async () => {
                await storageAPI.local.set({
                    '@Sidebar-reading_view': true,
                })
            }, 1000)
        }
    }

    cleanup = () => {
        this.options.annotationsCache.events.removeListener(
            'newAnnotationsState',
            this.cacheAnnotationsSubscription,
        )
        this.options.annotationsCache.events.removeListener(
            'newListsState',
            this.cacheListsSubscription,
        )
    }

    private cacheListsSubscription = (
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

    private cacheAnnotationsSubscription = (
        nextAnnotations: PageAnnotationsCacheInterface['annotations'],
    ) => {
        this.emitMutation({
            noteCreateState: { $set: 'success' },
            annotations: { $set: nextAnnotations },
            annotationCardInstances: {
                $apply: (
                    prev: SidebarContainerState['annotationCardInstances'],
                ) =>
                    fromPairs(
                        normalizedStateToArray(nextAnnotations)
                            .map((annot) => {
                                const cardIdForMyAnnotsTab = generateAnnotationCardInstanceId(
                                    annot,
                                )

                                return [
                                    ...annot.unifiedListIds
                                        // Don't create annot card instances for foreign lists (won't show up in spaces tab)
                                        .filter(
                                            (unifiedListId) =>
                                                !this.options.annotationsCache
                                                    .lists.byId[unifiedListId]
                                                    ?.isForeignList,
                                        )
                                        .map((unifiedListId) => {
                                            const cardIdForListInstance = generateAnnotationCardInstanceId(
                                                annot,
                                                unifiedListId,
                                            )

                                            return [
                                                cardIdForListInstance,
                                                prev[cardIdForListInstance] ??
                                                    initAnnotationCardInstance(
                                                        annot,
                                                    ),
                                            ]
                                        }),
                                    [
                                        cardIdForMyAnnotsTab,
                                        prev[cardIdForMyAnnotsTab] ??
                                            initAnnotationCardInstance(annot),
                                    ],
                                ]
                            })
                            .flat(),
                    ),
            },
        })
    }

    private readingViewStorageListener = async (enable: boolean) => {
        this.resizeObserver = new ResizeObserver(this.debounceReadingWidth)

        if (this.readingViewState['@Sidebar-reading_view']) {
            this.emitMutation({
                readingView: { $set: true },
            })
            this.resizeObserver.observe(this.sidebar)
            window.addEventListener('resize', this.debounceReadingWidth)
            this.setReadingWidth()
        }
        if (!this.readingViewState['@Sidebar-reading_view']) {
            this.emitMutation({
                readingView: { $set: false },
            })
        }

        const { storageAPI } = this.options
        if (enable) {
            storageAPI.onChanged.addListener(this.toggleReadingView)
        } else {
            storageAPI.onChanged.removeListener(this.toggleReadingView)
            this.resizeObserver.disconnect()
        }
    }

    private debounceReadingWidth = throttle(this.setReadingWidth.bind(this), 50)

    private toggleReadingView = (changes: Storage.StorageChange) => {
        for (let key of Object.entries(changes)) {
            if (key[0] === '@Sidebar-reading_view') {
                this.emitMutation({
                    readingView: { $set: key[1].newValue },
                })
                if (key[1].newValue) {
                    this.setReadingWidth()
                    this.resizeObserver.observe(this.sidebar)
                    window.addEventListener('resize', this.debounceReadingWidth)
                } else {
                    document.body.style.width = 'initial'
                    this.resizeObserver.disconnect()
                    window.removeEventListener(
                        'resize',
                        this.debounceReadingWidth,
                    )
                }
            }
        }
    }

    private setReadingWidth() {
        const sidebar = this.sidebar
        let currentsidebarWidth = sidebar.offsetWidth
        let currentWindowWidth = window.innerWidth
        let readingWidth = currentWindowWidth - currentsidebarWidth - 50 + 'px'
        document.body.style.width = readingWidth
    }

    sortAnnotations: EventHandler<'sortAnnotations'> = ({
        event: { sortingFn },
    }) => this.options.annotationsCache.sortAnnotations(sortingFn)

    private async ensureLoggedIn(): Promise<boolean> {
        const {
            authBG,
            setLoginModalShown,
            setDisplayNameModalShown,
        } = this.options

        const user = await authBG.getCurrentUser()
        if (user != null) {
            if (!user.displayName?.length) {
                const userProfile = await authBG.getUserProfile()
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

        // if (event.isWidthLocked) {
        //     let sidebarWidth = toInteger(event.newWidth?.replace('px', '') ?? 0)
        //     let windowWidth = window.innerWidth
        //     let width = (windowWidth - sidebarWidth).toString()
        //     width = width + 'px'
        //     document.body.style.width = width
        // }
    }

    setPopoutsActive: EventHandler<'setPopoutsActive'> = async ({ event }) => {
        this.emitMutation({
            popoutsActive: { $set: event },
        })
    }

    show: EventHandler<'show'> = async ({ event }) => {
        this.readingViewState =
            (await browser.storage.local.get('@Sidebar-reading_view')) ?? false
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

    hide: EventHandler<'hide'> = async ({ event, previousState }) => {
        this.readingViewState =
            (await browser.storage.local.get('@Sidebar-reading_view')) ?? false
        this.readingViewStorageListener(false)
        this.emitMutation({
            showState: { $set: 'hidden' },
            activeAnnotationId: { $set: null },
            readingView: { $set: false },
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
        if (!isFullUrl(event.fullPageUrl)) {
            throw new Error(
                'Tried to set annotation sidebar with a normalized page URL',
            )
        }

        const hasNetworkActivity = await this.options.pageActivityIndicatorBG.getPageActivityStatus(
            event.fullPageUrl,
        )

        this.emitMutation({
            pageHasNetworkAnnotations: {
                $set: hasNetworkActivity != 'no-activity',
            },
        })

        if (previousState.fullPageUrl === event.fullPageUrl) {
            return
        }

        const mutation: UIMutation<SidebarContainerState> = {
            fullPageUrl: { $set: event.fullPageUrl },
        }

        this.emitMutation(mutation)
        await this.hydrateAnnotationsCache(event.fullPageUrl, {
            renderHighlights: event.rerenderHighlights,
        })

        if (previousState.activeTab === 'spaces') {
            await this.loadRemoteAnnototationReferencesForCachedLists(
                previousState,
            )
        }
        if (previousState.activeTab === 'summary') {
            console.log('setPageUrl', event.fullPageUrl)
            await this.getPageSummary(event)
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
            annotationsBG: this.options.annotationsBG,
            contentSharingBG: this.options.contentSharingBG,
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
            commentBox,
            fullPageUrl,
            selectedListId,
            activeTab,
        } = previousState
        const comment = commentBox.commentText.trim()
        if (comment.length === 0) {
            return
        }
        const now = event.now ?? Date.now()
        const annotationId =
            event.annotationId ??
            generateAnnotationUrl({
                pageUrl: fullPageUrl,
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

            const localListIds = [...commentBox.lists]
            const maybeAddLocalListIdForCacheList = (
                unifiedListId?: UnifiedList['unifiedId'],
            ) => {
                if (unifiedListId != null) {
                    const { localId } = lists.byId[unifiedListId]
                    if (localId != null) {
                        localListIds.push(localId)
                    }
                }
            }
            // Adding a new annot in selected space mode should only work on the "Spaces" tab
            if (activeTab === 'spaces') {
                maybeAddLocalListIdForCacheList(selectedListId)
            }
            maybeAddLocalListIdForCacheList(event.listInstanceId)

            const { remoteAnnotationId, savePromise } = await createAnnotation({
                annotationData: {
                    comment,
                    fullPageUrl,
                    localListIds,
                    localId: annotationId,
                    createdWhen: new Date(now),
                },
                annotationsBG: this.options.annotationsBG,
                contentSharingBG: this.options.contentSharingBG,
                shareOpts: {
                    shouldShare: event.shouldShare,
                    shouldCopyShareLink: event.shouldShare,
                    isBulkShareProtected: event.isProtected,
                },
            })

            this.options.annotationsCache.addAnnotation({
                localId: annotationId,
                remoteId: remoteAnnotationId ?? undefined,
                normalizedPageUrl: normalizeUrl(fullPageUrl),
                privacyLevel: shareOptsToPrivacyLvl({
                    shouldShare: event.shouldShare,
                    isBulkShareProtected: event.isProtected,
                }),
                creator: this.options.currentUser,
                createdWhen: now,
                lastEdited: now,
                localListIds,
                comment,
            })

            await savePromise
        })
    }

    updateListsForAnnotation: EventHandler<
        'updateListsForAnnotation'
    > = async ({ event }) => {
        const { annotationsCache, contentSharingBG } = this.options
        this.emitMutation({ confirmSelectNoteSpaceArgs: { $set: null } })

        const existing =
            annotationsCache.annotations.byId[event.unifiedAnnotationId]
        if (!existing) {
            console.warn(
                "Attempted to update lists for annotation that isn't cached:",
                event,
                annotationsCache,
            )
            return
        }
        if (!existing.localId) {
            console.warn(
                `Attempted to update lists for annotation that isn't owned:`,
                event,
                annotationsCache,
            )
            return
        }

        const unifiedListIds = new Set(existing.unifiedListIds)
        let bgPromise: Promise<{ sharingState: AnnotationSharingState }>
        if (event.added != null) {
            const cacheListId = annotationsCache.getListByLocalId(event.added)
                ?.unifiedId
            unifiedListIds.add(cacheListId)
            bgPromise = contentSharingBG.shareAnnotationToSomeLists({
                annotationUrl: existing.localId,
                localListIds: [event.added],
                protectAnnotation: event.options?.protectAnnotation,
            })
        } else if (event.deleted != null) {
            const cacheListId = annotationsCache.getListByLocalId(event.deleted)
                ?.unifiedId
            unifiedListIds.delete(cacheListId)
            bgPromise = contentSharingBG.unshareAnnotationFromList({
                annotationUrl: existing.localId,
                localListId: event.deleted,
            })
        }

        annotationsCache.updateAnnotation(
            {
                comment: existing.comment,
                remoteId: existing.remoteId,
                unifiedListIds: [...unifiedListIds],
                unifiedId: event.unifiedAnnotationId,
                privacyLevel: event.options?.protectAnnotation
                    ? AnnotationPrivacyLevels.PROTECTED
                    : existing.privacyLevel,
            },
            { keepListsIfUnsharing: event.options?.protectAnnotation },
        )

        const { sharingState } = await bgPromise

        // Update again with the calculated lists and privacy lvl from the BG ops (TODO: there's gotta be a nicer way to handle this optimistically in the UI)
        annotationsCache.updateAnnotation(
            {
                comment: existing.comment,
                remoteId: sharingState.remoteId
                    ? sharingState.remoteId.toString()
                    : existing.remoteId,
                unifiedId: event.unifiedAnnotationId,
                privacyLevel: sharingState.privacyLevel,
                unifiedListIds: [
                    ...sharingState.privateListIds,
                    ...sharingState.sharedListIds,
                ]
                    .map(
                        (localListId) =>
                            annotationsCache.getListByLocalId(localListId)
                                ?.unifiedId,
                    )
                    .filter((id) => !!id),
            },
            { keepListsIfUnsharing: true },
        )
    }

    setNewPageNoteLists: EventHandler<'setNewPageNoteLists'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            commentBox: { lists: { $set: event.lists } },
        })
    }

    goToAnnotationInNewTab: EventHandler<'goToAnnotationInNewTab'> = async ({
        event,
    }) => {
        this.emitMutation({
            activeAnnotationId: { $set: event.unifiedAnnotationId },
        })

        const annotation = this.options.annotationsCache.annotations.byId[
            event.unifiedAnnotationId
        ]
        if (!annotation) {
            throw new Error(
                `Could not find cached annotation data for ID: ${event.unifiedAnnotationId}`,
            )
        }

        return this.options.contentScriptsBG.goToAnnotationFromDashboardSidebar(
            {
                fullPageUrl:
                    this.options.fullPageUrl ??
                    'https://' + annotation.normalizedPageUrl,
                annotationCacheId: event.unifiedAnnotationId,
            },
        )
    }

    deleteAnnotation: EventHandler<'deleteAnnotation'> = async ({ event }) => {
        const { annotationsCache, annotationsBG } = this.options
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
        previousState,
    }) => {
        this.emitMutation({
            activeAnnotationId: { $set: event.unifiedAnnotationId },
        })

        const cachedAnnotation = this.options.annotationsCache.annotations.byId[
            event.unifiedAnnotationId
        ]
        if (cachedAnnotation?.selector != null) {
            this.options.events?.emit('highlightAndScroll', {
                highlight: cachedAnnotation,
            })
        }

        if (!event.mode) {
            return
        }
        const location = previousState.selectedListId ?? undefined
        const cardId = generateAnnotationCardInstanceId(
            {
                unifiedId: event.unifiedAnnotationId,
            },
            location,
        )

        // Likely a highlight for another user's annotation, thus non-existent in "annotations" tab
        if (previousState.annotationCardInstances[cardId] == null) {
            return
        }

        if (event.mode === 'edit') {
            this.emitMutation({
                annotationCardInstances: {
                    [cardId]: { isCommentEditing: { $set: true } },
                },
            })
        } else if (event.mode === 'edit_spaces') {
            this.emitMutation({
                annotationCardInstances: {
                    [cardId]: { cardMode: { $set: 'space-picker' } },
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

    private async loadRemoteAnnototationReferencesForCachedLists(
        state: SidebarContainerState,
    ): Promise<void> {
        const listsWithRemoteAnnots = normalizedStateToArray(
            this.options.annotationsCache.lists,
        ).filter(
            (list) =>
                list.hasRemoteAnnotationsToLoad &&
                list.remoteId != null &&
                state.listInstances[list.unifiedId]?.annotationRefsLoadState ===
                    'pristine', // Ensure it hasn't already been loaded
        )

        const nextState = await this.loadRemoteAnnotationReferencesForSpecificLists(
            state,
            listsWithRemoteAnnots,
        )
        this.renderOpenSpaceInstanceHighlights(nextState)
    }

    private async loadRemoteAnnotationReferencesForSpecificLists(
        state: SidebarContainerState,
        lists: UnifiedList[],
    ): Promise<SidebarContainerState> {
        let nextState = state
        if (!lists.length) {
            return nextState
        }

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
                const annotationRefsByList = await this.options.customListsBG.fetchAnnotationRefsForRemoteListsOnPage(
                    {
                        normalizedPageUrl: normalizeUrl(state.fullPageUrl),
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

    setIsolatedViewOnSidebarLoad: EventHandler<
        'setIsolatedViewOnSidebarLoad'
    > = async ({}) => {
        this.emitMutation({
            activeTab: { $set: 'spaces' },
            loadState: { $set: 'running' },
        })
    }

    async getPageSummary(data) {
        this.emitMutation({
            loadState: { $set: 'running' },
        })

        await this.options.summarizeBG.startPageSummaryStream(data.fullPageUrl)

        // const summaryProvider = new SummarizationService()

        // const response = await this.options.summarizeBG.getPageSummary(url)

        // console.log('response', response)

        // if (response.status === 'success') {
        //     let summaryText = response.choices[0].text

        //     if (summaryText.startsWith(':')) {
        //         summaryText = summaryText.slice(2)
        //     }

        //     this.emitMutation({
        //         pageSummary: {
        //             $set: summaryText,
        //         },
        //         loadState: { $set: 'success' },
        //     })
        // } else if (response.status === 'prompt-too-long') {
        //     this.emitMutation({
        //         loadState: { $set: 'error' },
        //     })
        // } else {
        //     this.emitMutation({
        //         loadState: { $set: 'error' },
        //     })
        // }
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

        if (event.tab === 'annotations') {
            this.renderOwnHighlights(previousState)
        } else if (event.tab === 'spaces') {
            await this.loadRemoteAnnototationReferencesForCachedLists(
                previousState,
            )
        } else if (event.tab === 'summary') {
            await this.getPageSummary(previousState)
        }
    }

    private async maybeLoadListRemoteAnnotations(
        state: SidebarContainerState,
        unifiedListId: UnifiedList['unifiedId'],
    ) {
        const {
            contentConversationsBG,
            annotationsCache,
            annotationsBG,
        } = this.options
        const list = state.lists.byId[unifiedListId]
        const listInstance = state.listInstances[unifiedListId]

        if (
            !list ||
            !listInstance ||
            list.remoteId == null ||
            listInstance.annotationsLoadState !== 'pristine' // Means already loaded previously
        ) {
            return
        }

        let sharedAnnotationReferences: SharedAnnotationReference[]

        // This first clause covers the case of setting up conversations states for own shared lists, without entries from others
        if (
            !list.hasRemoteAnnotationsToLoad ||
            listInstance.sharedAnnotationReferences == null
        ) {
            const sharedAnnotationUnifiedIds = list.unifiedAnnotationIds.filter(
                (unifiedId) =>
                    annotationsCache.annotations.byId[unifiedId]?.remoteId !=
                    null,
            )

            sharedAnnotationReferences = sharedAnnotationUnifiedIds.map(
                (unifiedId) => ({
                    type: 'shared-annotation-reference',
                    id: annotationsCache.annotations.byId[unifiedId].remoteId,
                }),
            )

            this.emitMutation({
                conversations: {
                    $merge: fromPairs(
                        sharedAnnotationUnifiedIds.map((unifiedId) => [
                            generateAnnotationCardInstanceId(
                                { unifiedId },
                                list.unifiedId,
                            ),
                            getInitialAnnotationConversationState(),
                        ]),
                    ),
                },
            })
        } else {
            // This clause covers the other cases of setting up convo states for followed and joined lists
            sharedAnnotationReferences = listInstance.sharedAnnotationReferences

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
                    const sharedAnnotations = await annotationsBG.getSharedAnnotations(
                        {
                            sharedAnnotationReferences:
                                listInstance.sharedAnnotationReferences,
                            withCreatorData: true,
                        },
                    )

                    const usersData: SidebarContainerState['users'] = {}
                    for (const annot of sharedAnnotations) {
                        if (annot.creator?.user.displayName != null) {
                            usersData[annot.creatorReference.id] = {
                                name: annot.creator.user.displayName,
                                profileImgSrc: annot.creator.profile?.avatarURL,
                            }
                        }

                        annotationsCache.addAnnotation(
                            cacheUtils.reshapeSharedAnnotationForCache(annot, {
                                extraData: { unifiedListIds: [unifiedListId] },
                            }),
                        )
                    }

                    this.emitMutation({
                        users: { $merge: usersData },
                        conversations: {
                            $merge: getInitialAnnotationConversationStates(
                                listInstance.sharedAnnotationReferences.map(
                                    ({ id }) => ({
                                        linkId: id.toString(),
                                    }),
                                ),
                                (remoteAnnotId) =>
                                    this.buildConversationId(remoteAnnotId, {
                                        type: 'shared-list-reference',
                                        id: list.remoteId,
                                    }),
                            ),
                        },
                    })
                },
            )
        }

        await this.detectConversationThreads(
            unifiedListId,
            list.remoteId,
            sharedAnnotationReferences,
        )
    }

    async detectConversationThreads(
        unifiedListId: string,
        remoteListId: string,
        sharedAnnotationReferences: SharedAnnotationReference[],
    ) {
        await executeUITask(
            this,
            (taskState) => ({
                listInstances: {
                    [unifiedListId]: {
                        conversationsLoadState: { $set: taskState },
                    },
                },
            }),
            async () => {
                await detectAnnotationConversationThreads(this as any, {
                    buildConversationId: this.buildConversationId,
                    annotationReferences: sharedAnnotationReferences,
                    sharedListReference: {
                        type: 'shared-list-reference',
                        id: remoteListId,
                    },
                    getThreadsForAnnotations: ({
                        annotationReferences,
                        sharedListReference,
                    }) =>
                        this.options.contentConversationsBG.getThreadsForSharedAnnotations(
                            {
                                sharedAnnotationReferences: annotationReferences,
                                sharedListReference,
                            },
                        ),
                })
            },
        )
    }

    expandListAnnotations: EventHandler<'expandListAnnotations'> = async ({
        event,
        previousState,
    }) => {
        const listInstanceMutation: UIMutation<SidebarContainerState> = {
            listInstances: {
                [event.unifiedListId]: {
                    isOpen: { $apply: (isOpen) => !isOpen },
                },
            },
        }
        const nextState = this.withMutation(previousState, listInstanceMutation)
        this.emitMutation(listInstanceMutation)

        await this.maybeLoadListRemoteAnnotations(
            previousState,
            event.unifiedListId,
        )

        // NOTE: It's important the annots+lists states are gotten from the cache here as the above async call
        //   can result in new annotations being added to the cache which won't yet update this logic class' state
        //   (though they cache's state will be up-to-date)
        this.renderOpenSpaceInstanceHighlights({
            annotations: this.options.annotationsCache.annotations,
            lists: this.options.annotationsCache.lists,
            listInstances: nextState.listInstances,
        })
    }

    markFeedAsRead: EventHandler<'markFeedAsRead'> = async () => {
        // const activityindicator = await this.options.activityIndicatorBG.markActivitiesAsSeen()
        // await setLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY, false)

        this.emitMutation({
            hasFeedActivity: { $set: false },
        })
    }

    private async setLocallyAvailableSelectedList(
        state: SidebarContainerState,
        unifiedListId: UnifiedList['unifiedId'],
    ) {
        this.options.events?.emit('setSelectedList', unifiedListId)

        const list = state.lists.byId[unifiedListId]
        const listInstance = state.listInstances[unifiedListId]
        if (!list || !listInstance) {
            console.warn(
                'setSelectedList: could not find matching list for cache ID:',
                unifiedListId,
            )
            return
        }

        this.emitMutation({
            activeTab: { $set: 'spaces' },
            selectedListId: { $set: unifiedListId },
        })

        if (list.remoteId != null) {
            let nextState = state
            nextState = await this.loadRemoteAnnotationReferencesForSpecificLists(
                state,
                [list],
            )

            await this.maybeLoadListRemoteAnnotations(nextState, unifiedListId)
        }

        this.options.events?.emit('renderHighlights', {
            highlights: cacheUtils.getListHighlightsArray(
                this.options.annotationsCache,
                unifiedListId,
            ),
        })
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

        if (event.unifiedListId == null) {
            this.options.events?.emit('setSelectedList', null)
            this.emitMutation({ selectedListId: { $set: null } })
            this.renderOpenSpaceInstanceHighlights(previousState)
            return
        }

        await this.setLocallyAvailableSelectedList(
            previousState,
            event.unifiedListId,
        )
    }

    setSelectedListFromWebUI: EventHandler<
        'setSelectedListFromWebUI'
    > = async ({ event, previousState }) => {
        this.emitMutation({
            activeTab: { $set: 'spaces' },
        })

        const {
            annotationsCache,
            customListsBG,
            authBG,
            fullPageUrl,
        } = this.options

        const cachedList = annotationsCache.getListByRemoteId(
            event.sharedListId,
        )

        // If locally available, proceed as usual
        if (cachedList) {
            await this.setLocallyAvailableSelectedList(
                previousState,
                cachedList.unifiedId,
            )
            this.emitMutation({
                loadState: { $set: 'success' },
            })

            return
        }

        if (!fullPageUrl) {
            throw new Error(
                'Could not load remote list data for selected list mode without `props.fullPageUrl` being set in sidebar',
            )
        }

        // Else we're dealing with a foreign list which we need to load remotely
        await executeUITask(this, 'foreignSelectedListLoadState', async () => {
            const sharedList = await customListsBG.fetchSharedListDataWithPageAnnotations(
                {
                    remoteListId: event.sharedListId,
                    normalizedPageUrl: normalizeUrl(fullPageUrl),
                },
            )

            // check ownership status of current list for the case that we don't yet have the data synced up and people can start collaborating

            if (!sharedList) {
                throw new Error(
                    `Could not load remote list data for selected list mode - ID: ${event.sharedListId}`,
                )
            }

            const unifiedList = annotationsCache.addList({
                remoteId: event.sharedListId,
                name: sharedList.title,
                creator: sharedList.creator,
                description: sharedList.description,
                isForeignList: true,
                hasRemoteAnnotationsToLoad:
                    sharedList.sharedAnnotations == null ? false : true,
                unifiedAnnotationIds: [], // Will be populated soon when annots get cached
            })

            if (sharedList.sharedAnnotations == null) {
                this.emitMutation({
                    selectedListId: { $set: unifiedList.unifiedId },
                    // NOTE: this is the only time we're manually mutating the listInstances state outside the cache subscription - maybe there's a "cleaner" way to do this
                    listInstances: {
                        [unifiedList.unifiedId]: {
                            annotationRefsLoadState: { $set: 'success' },
                            conversationsLoadState: { $set: 'success' },
                            annotationsLoadState: { $set: 'success' },
                            sharedAnnotationReferences: {
                                $set: [],
                            },
                        },
                    },
                    loadState: { $set: 'success' },
                })

                return
            }

            this.emitMutation({
                loadState: { $set: 'success' },
            })

            let sharedAnnotationReferences: SharedAnnotationReference[] = []
            const sharedAnnotationUnifiedIds: string[] = []

            sharedList.sharedAnnotations.forEach((sharedAnnot) => {
                sharedAnnotationReferences.push(sharedAnnot.reference)
                const { unifiedId } = annotationsCache.addAnnotation({
                    body: sharedAnnot.body,
                    creator: sharedAnnot.creator,
                    comment: sharedAnnot.comment,
                    lastEdited: sharedAnnot.updatedWhen,
                    createdWhen: sharedAnnot.createdWhen,
                    selector:
                        sharedAnnot.selector != null
                            ? JSON.parse(sharedAnnot.selector)
                            : undefined,
                    remoteId: sharedAnnot.reference.id.toString(),
                    normalizedPageUrl: sharedAnnot.normalizedPageUrl,
                    unifiedListIds: [unifiedList.unifiedId],
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    localListIds: [],
                })
                sharedAnnotationUnifiedIds.push(unifiedId)
            })

            this.emitMutation({
                selectedListId: { $set: unifiedList.unifiedId },
                // NOTE: this is the only time we're manually mutating the listInstances state outside the cache subscription - maybe there's a "cleaner" way to do this
                listInstances: {
                    [unifiedList.unifiedId]: {
                        annotationRefsLoadState: { $set: 'success' },
                        conversationsLoadState: { $set: 'success' },
                        annotationsLoadState: { $set: 'success' },
                        sharedAnnotationReferences: {
                            $set: sharedAnnotationReferences,
                        },
                    },
                },
                conversations: {
                    $merge: fromPairs(
                        sharedAnnotationUnifiedIds.map((unifiedId) => [
                            generateAnnotationCardInstanceId(
                                { unifiedId },
                                unifiedList.unifiedId,
                            ),
                            getInitialAnnotationConversationState(),
                        ]),
                    ),
                },
            })

            this.options.events?.emit('renderHighlights', {
                highlights: cacheUtils.getListHighlightsArray(
                    this.options.annotationsCache,
                    unifiedList.unifiedId,
                ),
            })

            await this.detectConversationThreads(
                unifiedList.unifiedId,
                event.sharedListId,
                sharedAnnotationReferences,
            )
        })

        // const list = previousState.lists.byId[event.unifiedListId]
        // const listInstance = previousState.listInstances[event.unifiedListId]
        // if (!list || !listInstance) {
        //     console.warn(
        //         'setSelectedList: could not find matching list for cache ID:',
        //         event.unifiedListId,
        //     )
        //     return
        // }

        // this.emitMutation({
        //     activeTab: { $set: 'spaces' },
        //     selectedListId: { $set: event.unifiedListId },
        // })

        // if (list.remoteId != null) {
        //     let nextState = previousState
        //     if (listInstance.annotationRefsLoadState === 'pristine') {
        //         nextState = await this.loadRemoteAnnotationReferencesForLists(
        //             previousState,
        //             [list],
        //         )
        //     }
        //     await this.maybeLoadListRemoteAnnotations(
        //         nextState,
        //         event.unifiedListId,
        //     )
        // }

        // this.options.events?.emit('renderHighlights', {
        //     highlights: cacheUtils.getListHighlightsArray(
        //         this.options.annotationsCache,
        //         event.unifiedListId,
        //     ),
        // })
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

        for (const annotation of normalizedStateToArray(
            annotationsCache.annotations,
        )) {
            const sharingState = event[annotation?.localId]
            if (!sharingState) {
                continue
            }

            const unifiedListIds = [
                ...sharingState.privateListIds,
                ...sharingState.sharedListIds,
            ]
                .map(
                    (localListId) =>
                        annotationsCache.getListByLocalId(localListId)
                            ?.unifiedId,
                )
                .filter((id) => !!id)

            annotationsCache.updateAnnotation({
                remoteId: sharingState.remoteId
                    ? sharingState.remoteId.toString()
                    : undefined,
                unifiedId: annotation.unifiedId,
                privacyLevel: sharingState.privacyLevel,
                unifiedListIds,
            })
        }
    }

    updateAnnotationShareInfo: EventHandler<
        'updateAnnotationShareInfo'
    > = async ({ previousState, event }) => {
        const existing =
            previousState.annotations.byId[event.unifiedAnnotationId]

        if (existing.privacyLevel === event.privacyLevel) {
            return
        }

        this.options.annotationsCache.updateAnnotation(
            {
                ...existing,
                privacyLevel: event.privacyLevel,
            },
            { keepListsIfUnsharing: event.keepListsIfUnsharing },
        )
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
