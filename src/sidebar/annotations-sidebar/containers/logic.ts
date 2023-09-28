import fromPairs from 'lodash/fromPairs'
import clone from 'lodash/cloneDeep'
import browser from 'webextension-polyfill'
import {
    UILogic,
    UIEventHandler,
    UIMutation,
    loadInitial,
    executeUITask,
} from '@worldbrain/memex-common/lib/main-ui/classes/logic'
import {
    normalizeUrl,
    isFullUrl,
} from '@worldbrain/memex-common/lib/url-utils/normalize'
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
    NormalizedState,
    initNormalizedState,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import { SIDEBAR_WIDTH_STORAGE_KEY } from '../constants'
import { AI_PROMPT_DEFAULTS } from '../constants'
import {
    getInitialAnnotationConversationState,
    getInitialAnnotationConversationStates,
} from '@worldbrain/memex-common/lib/content-conversations/ui/utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type {
    PageAnnotationsCacheEvents,
    UnifiedAnnotation,
    UnifiedList,
    UnifiedListForCache,
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
import { isUrlPDFViewerUrl } from 'src/pdf/util'
import type { Storage } from 'webextension-polyfill'
import throttle from 'lodash/throttle'
import {
    getRemoteEventEmitter,
    TypedRemoteEventEmitter,
} from 'src/util/webextensionRPC'
import {
    AIActionAllowed,
    updateAICounter,
} from 'src/util/subscriptions/storage'
import {
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import {
    convertMemexURLintoTelegramURL,
    getTelegramUserDisplayName,
} from '@worldbrain/memex-common/lib/telegram/utils'
import { enforceTrialPeriod30Days } from 'src/util/subscriptions/storage'
import {
    SpacePickerDependencies,
    SpacePickerEvent,
} from 'src/custom-lists/ui/CollectionPicker/types'
import { validateSpaceName } from '@worldbrain/memex-common/lib/utils/space-name-validation'
import { sleepPromise } from 'src/util/promises'
import { ImageSupportInterface } from 'src/image-support/background/types'
import sanitizeHTMLhelper from '@worldbrain/memex-common/lib/utils/sanitize-html-helper'
import { processCommentForImageUpload } from '@worldbrain/memex-common/lib/annotations/processCommentForImageUpload'
import { PkmSyncInterface } from 'src/pkm-integrations/background/types'
import { RemoteBGScriptInterface } from 'src/background-script/types'

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
    imageSupport?: ImageSupportInterface<'caller'>
    pkmSyncBG?: PkmSyncInterface
    bgScriptBG?: RemoteBGScriptInterface
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
    syncSettings: SyncSettingsStore<'contentSharing' | 'extension' | 'openAI'>
    resizeObserver
    sidebar
    readingViewState
    openAIkey
    showState
    focusIndex
    summarisePageEvents: TypedRemoteEventEmitter<'pageSummary'>
    AIpromptSuggestions: { prompt: string; focused: boolean | null }[]
    // NOTE: this mirrors the state key of the same name. Only really exists as the cache's `updatedPageData` event listener can't access state :/
    private fullPageUrl: string
    private youtubeTranscriptSummary: string = ''
    private editor = null

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
                    deleteReply: options.contentConversationsBG.deleteReply,
                    editReply: options.contentConversationsBG.editReply,
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
                                state.fullPageUrl ?? this.fullPageUrl,
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
            pageLinkCreateState: 'pristine',
            secondarySearchState: 'pristine',
            remoteAnnotationsLoadState: 'pristine',
            foreignSelectedListLoadState: 'pristine',
            selectedTextAIPreview: undefined,

            users: {},
            currentUserReference: null,
            pillVisibility: 'unhover',

            isWidthLocked: false,
            isLocked: false,
            fullPageUrl: this.options.fullPageUrl,
            showState: 'hidden',
            annotationSharingAccess: 'sharing-allowed',
            readingView: false,
            showAllNotesCopyPaster: false,
            pageSummary: '',
            selectedListId: null,
            spaceTitleEditValue: '',
            activeListContextMenuId: null,

            commentBox: { ...INIT_FORM_STATE },

            listInstances: {},
            annotationCardInstances: {},

            shareMenuAnnotationInstanceId: null,
            spacePickerAnnotationInstance: null,
            copyPasterAnnotationInstanceId: null,

            annotations: initNormalizedState(),
            lists: initNormalizedState(),
            pageListIds: new Set(),
            pageActiveListIds: [],

            activeAnnotationId: null, // TODO: make unified ID

            showCommentBox: false,
            showCongratsMessage: false,
            showClearFiltersBtn: false,
            showFiltersSidebar: false,
            showSocialSearch: false,
            shouldShowTagsUIs: false,
            prompt: undefined,
            showUpgradeModal: false,

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
            queryMode: 'glanceSummary',
            showLengthError: false,
            showAISuggestionsDropDown: false,
            showAICounter: false,
            AIsuggestions: [],
            isTrial: false,
            signupDate: null,
            showSharePageTooltip: false,
            firstTimeSharingPageLink: false,
            selectedListForShareMenu: null,
            renameListErrorMessage: null,
            sidebarRightBorderPosition: null,
            youtubeTranscriptSummaryloadState: 'pristine',
        }
    }

    buildConversationId: ConversationIdBuilder = (
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
            await cacheUtils.hydrateCacheForPageAnnotations({
                fullPageUrl,
                user: this.options.getCurrentUser(),
                cache: this.options.annotationsCache,
                skipListHydration: this.options.sidebarContext === 'dashboard',
                bgModules: {
                    customLists: this.options.customListsBG,
                    annotations: this.options.annotationsBG,
                    contentSharing: this.options.contentSharingBG,
                    pageActivityIndicator: this.options.pageActivityIndicatorBG,
                },
            })
        })

        if (opts.renderHighlights) {
            const annotations = this.transformAnnotations(
                this.options.annotationsCache.annotations,
            )
            const activeTab = 'annotations' // replace this with the actual value if available
            this.renderOwnHighlights({ annotations, activeTab })
        }
    }

    private transformAnnotations(
        annotations: any,
    ): NormalizedState<UnifiedAnnotation, string> {
        // Transform `annotations` into the format expected by `renderOwnHighlights`
        // This is just a placeholder. Replace with your actual transformation logic.
        return {
            allIds: [],
            byId: {},
        }
    }

    private renderOwnHighlights = (
        state: Pick<SidebarContainerState, 'annotations' | 'activeTab'>,
    ) => {
        const highlights = cacheUtils.getUserHighlightsArray(
            { annotations: state.annotations },
            this.options.getCurrentUser()?.id.toString(),
        )
        this.options.events?.emit('renderHighlights', {
            highlights,
            removeExisting: state.activeTab === 'annotations' ? false : true,
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
            .filter(
                (annot) => annot?.body?.length > 0 && annot.selector != null,
            )

        this.options.events?.emit('renderHighlights', {
            highlights,
            removeExisting: true,
        })
    }

    private setupRemoteEventListeners() {
        this.summarisePageEvents = getRemoteEventEmitter('pageSummary')

        let isPageSummaryEmpty = true
        this.summarisePageEvents.on('newSummaryToken', ({ token }) => {
            let newToken = token
            if (isPageSummaryEmpty) {
                newToken = newToken.trimStart() // Remove the first two characters
            }
            isPageSummaryEmpty = false
            this.emitMutation({
                loadState: { $set: 'success' },
                pageSummary: { $apply: (prev) => prev + newToken },
            })
        })
        this.summarisePageEvents.on('startSummaryStream', () => {
            this.emitMutation({
                pageSummary: { $set: '' },
            })
        })

        this.summarisePageEvents.on('newSummaryTokenEditor', ({ token }) => {
            let newToken = token
            if (isPageSummaryEmpty) {
                newToken = newToken.trimStart() // Remove the first two characters
            }
            isPageSummaryEmpty = false
            this.youtubeTranscriptSummary =
                this.youtubeTranscriptSummary + newToken
            this.emitMutation({
                youtubeTranscriptSummaryloadState: { $set: 'success' },
                youtubeTranscriptSummary: { $apply: (prev) => prev + newToken },
            })
            let handledSuccessfully = false

            this.options.events.emit(
                'triggerYoutubeTimestampSummary',
                {
                    text: newToken,
                },
                (success) => {
                    handledSuccessfully = success
                },
            )
        })
    }

    /** Should only be used for state initialization. */
    private syncCachePageListsState(fullPageUrl: string): void {
        const normalizedPageUrl = normalizeUrl(fullPageUrl)
        const pageListCacheIdsSet =
            this.options.annotationsCache.pageListIds.get(normalizedPageUrl) ??
            new Set()
        this.cachePageListsSubscription(normalizedPageUrl, pageListCacheIdsSet)
    }

    private async setPageActivityState(fullPageUrl: string): Promise<void> {
        const { annotationsCache, pageActivityIndicatorBG } = this.options
        const pageActivity = await pageActivityIndicatorBG.getPageActivityStatus(
            fullPageUrl,
        )

        // Sync page active lists states with sidebar state
        const pageActiveListIds: SidebarContainerState['pageActiveListIds'] = []
        for (const remoteListId of pageActivity.remoteListIds) {
            const listData = annotationsCache.getListByRemoteId(
                remoteListId.toString(),
            )
            if (listData != null) {
                pageActiveListIds.push(listData.unifiedId)
            }
        }

        this.emitMutation({
            pageActiveListIds: { $set: pageActiveListIds },
            pageHasNetworkAnnotations: {
                $set:
                    pageActivity.status === 'has-annotations' ||
                    pageActivity.status === 'no-annotations',
            },
        })
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const {
            shouldHydrateCacheOnInit,
            annotationsCache,
            initialState,
            fullPageUrl,
            storageAPI,
            runtimeAPI,
        } = this.options

        this.setupRemoteEventListeners()
        annotationsCache.events.addListener(
            'newAnnotationsState',
            this.cacheAnnotationsSubscription,
        )
        annotationsCache.events.addListener(
            'newListsState',
            this.cacheListsSubscription,
        )
        annotationsCache.events.addListener(
            'updatedPageData',
            this.cachePageListsSubscription,
        )
        // Set initial state, based on what's in the cache (assuming it already has been hydrated)
        this.cacheAnnotationsSubscription(annotationsCache.annotations)
        this.cacheListsSubscription(annotationsCache.lists)

        const userReference = this.options.getCurrentUser()
        this.emitMutation({
            currentUserReference: { $set: userReference ?? null },
        })

        this.sidebar = document
            .getElementById('memex-sidebar-container')
            ?.shadowRoot.getElementById('annotationSidebarContainer')
        this.readingViewState =
            (await browser.storage.local.get('@Sidebar-reading_view')) ?? true
        // this.readingViewStorageListener(true)

        await loadInitial<SidebarContainerState>(this, async () => {
            this.showState = initialState ?? 'hidden'
            this.emitMutation({
                showState: { $set: initialState ?? 'hidden' },
                loadState: { $set: 'running' },
            })

            if (initialState === 'visible') {
                this.readingViewStorageListener(true)
            }

            if (fullPageUrl == null) {
                return
            }

            this.fullPageUrl = fullPageUrl
            if (shouldHydrateCacheOnInit) {
                await this.hydrateAnnotationsCache(this.fullPageUrl, {
                    renderHighlights: true,
                })
            }
            this.syncCachePageListsState(this.fullPageUrl)
            await this.setPageActivityState(this.fullPageUrl)
        })

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

        const signupDate = new Date(
            await (await this.options.authBG.getCurrentUser()).creationTime,
        ).getTime()

        this.emitMutation({
            isTrial: { $set: await enforceTrialPeriod30Days(signupDate) },
            signupDate: { $set: signupDate },
        })
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
        this.options.annotationsCache.events.removeListener(
            'updatedPageData',
            this.cachePageListsSubscription,
        )
    }

    private cacheListsSubscription: PageAnnotationsCacheEvents['newListsState'] = (
        nextLists,
    ) => {
        this.emitMutation({
            lists: { $set: nextLists },
            listInstances: {
                $apply: (prev: SidebarContainerState['listInstances']) =>
                    fromPairs(
                        normalizedStateToArray(nextLists).map((list) => [
                            list.unifiedId,
                            prev[list.unifiedId] ?? initListInstance(list),
                        ]),
                    ),
            },
            // Ensure conversation states exist for any shared annotation in any shared list
            conversations: {
                $apply: (prev: SidebarContainerState['conversations']) => {
                    return fromPairs(
                        normalizedStateToArray(nextLists)
                            .map((list) => {
                                if (list.remoteId == null) {
                                    return null
                                }
                                return list.unifiedAnnotationIds
                                    .map((annotId) => {
                                        const annotData = this.options
                                            .annotationsCache.annotations.byId[
                                            annotId
                                        ]
                                        if (annotData.remoteId == null) {
                                            return null
                                        }
                                        const conversationId = generateAnnotationCardInstanceId(
                                            list,
                                            annotId,
                                        )
                                        return [
                                            conversationId,
                                            prev[conversationId] ??
                                                getInitialAnnotationConversationState(),
                                        ]
                                    })
                                    .filter((a) => a != null)
                            })
                            .filter((a) => a != null)
                            .flat(),
                    )
                },
            },
        })
    }

    private cachePageListsSubscription: PageAnnotationsCacheEvents['updatedPageData'] = (
        normalizedPageUrl,
        nextPageListIds,
    ) => {
        if (
            this.fullPageUrl &&
            normalizeUrl(this.fullPageUrl) === normalizedPageUrl
        ) {
            this.emitMutation({ pageListIds: { $set: nextPageListIds } })
        }
    }

    private cacheAnnotationsSubscription: PageAnnotationsCacheEvents['newAnnotationsState'] = (
        nextAnnotations,
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
            // Ensure conversation states exist for any shared annotation in any shared list
            conversations: {
                $apply: (prev: SidebarContainerState['conversations']) => {
                    return fromPairs(
                        normalizedStateToArray(nextAnnotations)
                            .map((annot) => {
                                if (annot.remoteId == null) {
                                    return null
                                }
                                return annot.unifiedListIds
                                    .map((listId) => {
                                        const listData = this.options
                                            .annotationsCache.lists.byId[listId]
                                        if (listData.remoteId == null) {
                                            return null
                                        }
                                        const conversationId = generateAnnotationCardInstanceId(
                                            annot,
                                            listId,
                                        )
                                        return [
                                            conversationId,
                                            prev[conversationId] ??
                                                getInitialAnnotationConversationState(),
                                        ]
                                    })
                                    .filter((a) => a != null)
                            })
                            .filter((a) => a != null)
                            .flat(),
                    )
                },
            },
        })
    }

    private readingViewStorageListener = async (enable: boolean) => {
        this.resizeObserver = new ResizeObserver(this.debounceReadingWidth)

        try {
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
        } catch (e) {
            console.error(e)
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
                    this.showState = 'visible'
                    this.setReadingWidth()
                    if (
                        !window.location.href.startsWith(
                            'https://www.youtube.com',
                        )
                    ) {
                        document.body.style.position = 'relative'
                    }
                    this.resizeObserver.observe(this.sidebar)
                    window.addEventListener('resize', this.debounceReadingWidth)
                } else {
                    document.body.style.width = 'initial'
                    document.body.style.position = 'initial'
                    if (document.body.offsetWidth === 0) {
                        document.body.style.width = '100%'
                    }
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
        if (this.showState === 'visible') {
            if (!window.location.href.startsWith('https://www.youtube.com')) {
                document.body.style.position = 'relative'
            }
            const sidebar = this.sidebar
            let currentsidebarWidth = sidebar.offsetWidth
            let currentWindowWidth = window.innerWidth
            let readingWidth =
                currentWindowWidth - currentsidebarWidth - 40 + 'px'

            document.body.style.width = readingWidth
        }
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

    adjustRighPositionBasedOnRibbonPosition: EventHandler<
        'adjustRighPositionBasedOnRibbonPosition'
    > = ({ event }) => {
        this.emitMutation({
            sidebarRightBorderPosition: { $set: event.position },
        })

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
        this.showState = 'visible'
        this.readingViewState =
            (await browser.storage.local.get('@Sidebar-reading_view')) ?? false
        this.readingViewStorageListener(true)
        if (!window.location.href.startsWith('https://www.youtube.com')) {
            document.body.style.position = 'relative'
        }
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
        this.showState = 'hidden'
        document.body.style.position = 'initial'
        this.readingViewState =
            (await browser.storage.local.get('@Sidebar-reading_view')) ?? false
        this.readingViewStorageListener(false)
        this.emitMutation({
            showState: { $set: 'hidden' },
            activeAnnotationId: { $set: null },
            readingView: { $set: false },
        })

        document.body.style.width = 'initial'

        if (document.body.offsetWidth === 0) {
            document.body.style.width = '100%'
        }
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

    getAnnotationEditorIntoState: EventHandler<
        'getAnnotationEditorIntoState'
    > = (event) => {
        const editorRef = event

        this.emitMutation({
            annotationCreateEditorRef: { $set: editorRef },
        })
    }

    openWebUIPageForSpace: EventHandler<'openWebUIPageForSpace'> = async ({
        event,
    }) => {
        const listData = this.options.annotationsCache.lists.byId[
            event.unifiedListId
        ]
        if (!listData) {
            throw new Error(
                'Requested space to open in Web UI not found locally',
            )
        }
        if (!listData.remoteId) {
            throw new Error(
                'Requested space to open in Web UI has not been shared',
            )
        }

        let webUIUrl =
            listData.type === 'page-link'
                ? getSinglePageShareUrl({
                      remoteListId: listData.remoteId,
                      remoteListEntryId: listData.sharedListEntryId,
                  })
                : getListShareUrl({
                      remoteListId: listData.remoteId,
                  })

        if (webUIUrl.includes('?') && listData.type === 'page-link') {
            webUIUrl = webUIUrl + '&noAutoOpen=true'
        } else if (listData.type === 'page-link') {
            webUIUrl = webUIUrl + '?noAutoOpen=true'
        }
        window.open(webUIUrl, '_blank')
    }

    openContextMenuForList: EventHandler<'openContextMenuForList'> = async ({
        event,
        previousState,
    }) => {
        const listInstance = previousState.listInstances[event.unifiedListId]
        if (!listInstance) {
            throw new Error(
                'Could not find list instance to open context menu for',
            )
        }

        const nextActiveId =
            previousState.activeListContextMenuId === event.unifiedListId
                ? null
                : event.unifiedListId

        this.emitMutation({ activeListContextMenuId: { $set: nextActiveId } })
    }

    openPageListMenuForList: EventHandler<'openPageListMenuForList'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            showSharePageTooltip: { $set: !previousState.showSharePageTooltip },
        })
    }

    validateSpaceName(name: string, listIdToSkip?: number) {
        const validationResult = validateSpaceName(
            name,
            normalizedStateToArray(this.options.annotationsCache.lists).map(
                (entry) => ({
                    id: entry.localId,
                    name: entry.name,
                }),
            ),
            { listIdToSkip },
        )

        this.emitMutation({
            renameListErrorMessage: {
                $set:
                    validationResult.valid === false
                        ? validationResult.reason
                        : null,
            },
        })

        return validationResult
    }

    __getListDataByLocalId = (
        localId: number,
        { annotationsCache }: Pick<SpacePickerDependencies, 'annotationsCache'>,
        opts?: {
            source?: keyof SpacePickerEvent
            mustBeLocal?: boolean
        },
    ): UnifiedList => {
        const listData = annotationsCache.getListByLocalId(localId)
        const source = opts?.source ? `for ${opts.source} ` : ''

        if (!listData) {
            throw new Error(`Specified list data ${source}could not be found`)
        }
        if (opts?.mustBeLocal && listData.localId == null) {
            throw new Error(
                `Specified list data ${source}could not be found locally`,
            )
        }
        return listData
    }

    editListName: EventHandler<'editListName'> = async ({ event }) => {
        const newName = event.newName.trim()
        const listData = this.__getListDataByLocalId(
            event.localId,
            this.options,
            { source: 'renameList', mustBeLocal: true },
        )
        if (listData.name === newName) {
            return
        }
        const validationResult = this.validateSpaceName(newName)
        if (validationResult.valid === false) {
            this.emitMutation({
                renameListErrorMessage: {
                    $set: validationResult.reason,
                },
            })
            return
        }

        this.options.annotationsCache.updateList({
            unifiedId: event.unifiedListId,
            name: newName,
        })

        await this.options.customListsBG.updateListName({
            id: event.localId,
            oldName: event.oldName,
            newName,
        })
    }

    shareList: EventHandler<'shareList'> = async ({ event }) => {
        this.options.annotationsCache.updateList({
            unifiedId: event.unifiedListId,
            remoteId: event.remoteListId.toString(),
        })

        for (const localAnnotId in event.annotationLocalToRemoteIdsDict) {
            const annotData = this.options.annotationsCache.getAnnotationByLocalId(
                localAnnotId,
            )
            if (!annotData) {
                continue
            }
            this.options.annotationsCache.updateAnnotation({
                unifiedId: annotData.unifiedId,
                ...annotData,
                remoteId: event.annotationLocalToRemoteIdsDict[
                    localAnnotId
                ].toString(),
            })
        }
    }

    deleteList: EventHandler<'deleteList'> = async ({ event }) => {
        this.options.annotationsCache.removeList({
            unifiedId: event.unifiedListId,
        })
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

        if (previousState.fullPageUrl === event.fullPageUrl) {
            return
        }

        this.syncCachePageListsState(event.fullPageUrl)
        await this.setPageActivityState(event.fullPageUrl)

        this.fullPageUrl = event.fullPageUrl
        this.emitMutation({ fullPageUrl: { $set: event.fullPageUrl } })
        await this.hydrateAnnotationsCache(event.fullPageUrl, {
            renderHighlights: event.rerenderHighlights,
        })

        if (previousState.activeTab === 'spaces') {
            await this.loadRemoteAnnototationReferencesForCachedLists(
                previousState,
            )
        }
        if (previousState.activeTab === 'summary') {
            this.emitMutation({
                prompt: { $set: undefined },
            })
            await this.queryAI(
                event.fullPageUrl,
                undefined,
                undefined,
                true,
                previousState,
                undefined,
            )
        }
    }

    setAllNotesShareMenuShown: EventHandler<
        'setAllNotesShareMenuShown'
    > = async ({ previousState, event }) => {
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
    setAnnotationEditMode: EventHandler<'setAnnotationEditMode'> = async ({
        previousState,
        event,
    }) => {
        if (event.instanceLocation === 'annotations-tab') {
            if (previousState.activeTab !== 'annotations') {
                this.emitMutation({
                    activeTab: { $set: 'annotations' },
                })
            }
        } else {
            this.emitMutation({
                activeTab: { $set: 'spaces' },
            })
        }

        this.emitMutation({
            annotationCardInstances: {
                [getAnnotCardInstanceId(event)]: {
                    isCommentEditing: { $set: event.isEditing },
                },
            },
        })
    }

    cancelAnnotationEdit: EventHandler<'cancelAnnotationEdit'> = ({
        previousState,
        event,
    }) => {
        const previousAnnotationComment = this.options.annotationsCache
            .annotations.byId[event.unifiedAnnotationId].comment

        this.emitMutation({
            annotationCardInstances: {
                [getAnnotCardInstanceId(event)]: {
                    isCommentEditing: { $set: false },
                    comment: { $set: previousAnnotationComment },
                },
            },
        })
    }

    setAnnotationEditCommentText: EventHandler<
        'setAnnotationEditCommentText'
    > = async ({ event }) => {
        let annotation = event.annotation

        let newComment = (
            await processCommentForImageUpload(
                event.comment,
                annotation.normalizedPageUrl,
                annotation.localId,
                this.options.imageSupport,
                true,
            )
        ).toString()

        this.emitMutation({
            annotationCardInstances: {
                [getAnnotCardInstanceId(event)]: {
                    comment: { $set: newComment },
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
            annotationData?.creator?.id !== this.options.getCurrentUser()?.id ||
            (event.shouldShare && !(await this.ensureLoggedIn()))
        ) {
            return
        }

        const now = event.now ?? Date.now()
        const comment = sanitizeHTMLhelper(formData.comment.trim())
        const hasCoreAnnotChanged = comment !== annotationData.comment

        let commentForSaving = await processCommentForImageUpload(
            comment,
            annotationData.normalizedPageUrl,
            annotationData.localId,
            this.options.imageSupport,
        )

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

        const { remoteAnnotationId, savePromise } = await updateAnnotation({
            annotationsBG: this.options.annotationsBG,
            contentSharingBG: this.options.contentSharingBG,
            keepListsIfUnsharing: event.keepListsIfUnsharing,
            annotationData: {
                comment:
                    commentForSaving !== annotationData.comment
                        ? commentForSaving
                        : null,
                localId: annotationData.localId,
            },
            shareOpts: {
                shouldShare: event.shouldShare,
                shouldCopyShareLink: event.shouldShare,
                isBulkShareProtected:
                    event.isProtected || !!event.keepListsIfUnsharing,
                skipPrivacyLevelUpdate: event.mainBtnPressed,
            },
            pkmSyncBG: this.options.pkmSyncBG,
        })

        this.options.annotationsCache.updateAnnotation(
            {
                ...annotationData,
                comment: comment,
                remoteId: remoteAnnotationId ?? undefined,
                privacyLevel: shareOptsToPrivacyLvl({
                    shouldShare: event.shouldShare,
                    isBulkShareProtected:
                        event.isProtected || !!event.keepListsIfUnsharing,
                }),
            },
            { updateLastEditedTimestamp: hasCoreAnnotChanged, now },
        )

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

        await savePromise
    }

    setSpacePickerAnnotationInstance: EventHandler<
        'setSpacePickerAnnotationInstance'
    > = async ({ event }) => {
        this.emitMutation({
            spacePickerAnnotationInstance: { $set: event.state },
        })
    }

    setCopyPasterAnnotationInstanceId: EventHandler<
        'setCopyPasterAnnotationInstanceId'
    > = async ({ event }) => {
        this.emitMutation({
            copyPasterAnnotationInstanceId: { $set: event.instanceId },
        })
    }

    setShareMenuAnnotationInstanceId: EventHandler<
        'setShareMenuAnnotationInstanceId'
    > = async ({ event }) => {
        this.emitMutation({
            shareMenuAnnotationInstanceId: { $set: event.instanceId },
        })
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

    createNewNoteFromAISummary: EventHandler<
        'createNewNoteFromAISummary'
    > = async ({ event }) => {
        this.emitMutation({
            activeTab: { $set: 'annotations' },
            commentBox: {
                commentText: { $set: event.comment },
            },
        })
        this.options.focusCreateForm()
    }

    setNewPageNoteText: EventHandler<'setNewPageNoteText'> = async ({
        event,
    }) => {
        this.emitMutation({
            showCommentBox: { $set: true },
            commentBox: {
                commentText: { $set: event.comment },
            },
        })

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

        let OriginalCommentForCache = commentBox.commentText.trim()
        OriginalCommentForCache = sanitizeHTMLhelper(OriginalCommentForCache)
        if (OriginalCommentForCache.length === 0) {
            return
        }

        const now = event.now ?? Date.now()
        const annotationId =
            event.annotationId ??
            generateAnnotationUrl({
                pageUrl: fullPageUrl,
                now: () => now,
            })

        // this checks for all images in the comment that have not been uploaded yet, uploads them and gives back an updated version of the html code.
        // however the original comment is put in cache
        let commentForSaving = await processCommentForImageUpload(
            OriginalCommentForCache,
            normalizeUrl(fullPageUrl),
            annotationId,
            this.options.imageSupport,
        )

        this.emitMutation({
            commentBox: { $set: INIT_FORM_STATE },
            showCommentBox: { $set: false },
        })

        await executeUITask(this, 'noteCreateState', async () => {
            if (event.shouldShare && !(await this.ensureLoggedIn())) {
                return
            }
            // A bunch of side-effects occur based on the types of lists this annotation will be a part of, and there's
            //  a bunch of different IDs for lists, thus we gotta group these here to decide things further on in this logic
            const remoteListIds: string[] = []
            const localListIds = [...commentBox.lists]
            const unifiedListIds: UnifiedList['unifiedId'][] = []
            const maybeAddLocalListIdForCacheList = (
                unifiedListId?: UnifiedList['unifiedId'],
            ) => {
                if (unifiedListId == null) {
                    return
                }

                const { localId, remoteId } = lists.byId[unifiedListId]
                if (localId != null) {
                    localListIds.push(localId)
                }
                if (remoteId != null) {
                    remoteListIds.push(remoteId)
                }
                unifiedListIds.push(unifiedListId)
            }

            let title: string | null = null
            if (window.location.href.includes('web.telegram.org')) {
                title = getTelegramUserDisplayName(
                    document,
                    window.location.href,
                )
            }

            if (
                window.location.href.includes('x.com/messages/') ||
                window.location.href.includes('twitter.com/messages/')
            ) {
                title = document.title
            }

            // Adding a new annot in selected space mode should only work on the "Spaces" tab
            if (activeTab === 'spaces') {
                maybeAddLocalListIdForCacheList(selectedListId)
            }
            maybeAddLocalListIdForCacheList(event.listInstanceId)

            let privacyLevel: AnnotationPrivacyLevels
            if (remoteListIds.length) {
                privacyLevel = event.shouldShare
                    ? AnnotationPrivacyLevels.SHARED
                    : AnnotationPrivacyLevels.PROTECTED
            } else {
                privacyLevel = event.shouldShare
                    ? AnnotationPrivacyLevels.SHARED
                    : AnnotationPrivacyLevels.PRIVATE
            }

            const { remoteAnnotationId, savePromise } = await createAnnotation({
                annotationData: {
                    comment: commentForSaving,
                    fullPageUrl,
                    localListIds,
                    localId: annotationId,
                    createdWhen: new Date(now),
                    pageTitle: title,
                },
                syncSettingsBG: this.options.syncSettingsBG,
                annotationsBG: this.options.annotationsBG,
                contentSharingBG: this.options.contentSharingBG,
                skipListExistenceCheck:
                    previousState.hasListDataBeenManuallyPulled,
                privacyLevelOverride: privacyLevel,
                shareOpts: {
                    shouldShare: remoteListIds.length > 0 || event.shouldShare,
                    shouldCopyShareLink: event.shouldShare,
                    isBulkShareProtected: event.isProtected,
                },
                pkmSyncBG: this.options.pkmSyncBG,
            })

            this.options.annotationsCache.addAnnotation({
                localId: annotationId,
                remoteId: remoteAnnotationId ?? undefined,
                normalizedPageUrl: normalizeUrl(fullPageUrl),
                creator: this.options.getCurrentUser(),
                createdWhen: now,
                lastEdited: now,
                privacyLevel,
                // These only contain lists added in the UI dropdown (to be checked in case any are shared, which should influence the annot privacy level)
                localListIds: [...commentBox.lists],
                unifiedListIds, // These contain the context list (selected list or list instance)
                comment: OriginalCommentForCache,
            })

            if (remoteAnnotationId != null && remoteListIds.length > 0) {
                this.emitMutation({
                    conversations: {
                        $merge: fromPairs(
                            remoteListIds.map((remoteId) => [
                                this.buildConversationId(remoteAnnotationId, {
                                    type: 'shared-list-reference',
                                    id: remoteId,
                                }),
                                getInitialAnnotationConversationState(),
                            ]),
                        ),
                    },
                })
            }

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
            const cacheList = annotationsCache.getListByLocalId(event.added)
            if (!cacheList) {
                throw new Error(
                    'Cannot find list to add to annotation in cache',
                )
            }

            // Ensure any added shared list becomes part of the page lists
            if (cacheList.remoteId != null) {
                const pageUrl = normalizeUrl(this.fullPageUrl)
                const pageListsSet =
                    annotationsCache.pageListIds.get(pageUrl) ?? new Set()
                pageListsSet.add(cacheList.unifiedId)
                annotationsCache.setPageData(pageUrl, Array.from(pageListsSet))
            }

            unifiedListIds.add(cacheList.unifiedId)
            bgPromise = contentSharingBG.shareAnnotationToSomeLists({
                annotationUrl: existing.localId,
                localListIds: [event.added],
                protectAnnotation: event.options?.protectAnnotation,
            })
        } else if (event.deleted != null) {
            const cacheList = annotationsCache.getListByLocalId(event.deleted)
            if (!cacheList) {
                throw new Error(
                    'Cannot find list to remove from annotation in cache',
                )
            }

            unifiedListIds.delete(cacheList.unifiedId)
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

        let fullPageURL =
            this.fullPageUrl ?? 'https://' + annotation.normalizedPageUrl

        if (fullPageURL.includes('web.telegram.org')) {
            fullPageURL = convertMemexURLintoTelegramURL(fullPageURL)
        }
        return this.options.contentScriptsBG.goToAnnotationFromDashboardSidebar(
            {
                fullPageUrl: fullPageURL,
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

                nextState = this.applyAndEmitMutation(nextState, {
                    listInstances: mutation,
                })
            },
        )
        return nextState
    }

    async queryAI(
        fullPageUrl,
        highlightedText,
        prompt?,
        shortSummary?: boolean,
        previousState?: SidebarContainerState,
        textAsAlternative?: string,
        outputLocation?: 'editor' | 'summaryContainer' | null,
    ) {
        const isPagePDF =
            fullPageUrl && fullPageUrl.includes('/pdfjs/viewer.html?')
        const maxLength = 50000
        const articleLengthTooMuch =
            ((textAsAlternative && textAsAlternative.length > maxLength) ||
                document.body.innerText.length > maxLength) &&
            !fullPageUrl?.startsWith('https://www.youtube.com/watch') &&
            previousState.queryMode === 'summarize'
        const openAIKey = await this.syncSettings.openAI.get('apiKey')
        const hasAPIKey = openAIKey && openAIKey.startsWith('sk-')

        if (!hasAPIKey) {
            let canQueryAI = false
            if (previousState.isTrial) {
                canQueryAI = true
            } else if (await AIActionAllowed(this.options.analyticsBG)) {
                canQueryAI = true
            }
            if (!canQueryAI) {
                this.emitMutation({
                    showUpgradeModal: { $set: true },
                })
                return
            }
        }

        let queryPrompt = prompt ? prompt : undefined

        if (!previousState.isTrial) {
            await updateAICounter()
        }
        this.emitMutation({
            selectedTextAIPreview: {
                $set: highlightedText ? highlightedText : '',
            },
            loadState: {
                $set: outputLocation != 'editor' ? 'running' : 'pristine',
            },
            prompt: { $set: queryPrompt },
            showAICounter: { $set: true },
        })

        if (
            (!highlightedText && articleLengthTooMuch) ||
            (textAsAlternative && articleLengthTooMuch)
        ) {
            this.emitMutation({
                showLengthError: { $set: true },
                loadState: { $set: 'success' },
            })
            return
        } else {
            this.emitMutation({
                showLengthError: { $set: false },
            })
        }

        let textToAnalyse = textAsAlternative
            ? textAsAlternative
            : highlightedText
            ? highlightedText
            : undefined

        const response = await this.options.summarizeBG.startPageSummaryStream({
            fullPageUrl: isPagePDF
                ? undefined
                : fullPageUrl && fullPageUrl
                ? fullPageUrl
                : undefined,
            textToProcess: textToAnalyse,
            queryPrompt: queryPrompt,
            apiKey: openAIKey ? openAIKey : undefined,
            shortSummary: shortSummary,
            outputLocation: outputLocation ?? null,
        })

        return response
    }

    async executeAIquery() {}

    removeAISuggestion: EventHandler<'removeAISuggestion'> = async ({
        event,
        previousState,
    }) => {
        let suggestions = this.AIpromptSuggestions

        const suggestionToRemove = event.suggestion
        const newSuggestions = suggestions.filter(
            (item) => item.prompt !== suggestionToRemove,
        )

        const newSuggestionsToSave = newSuggestions.map((item) => item.prompt)

        await this.syncSettings.openAI.set(
            'promptSuggestions',
            newSuggestionsToSave,
        )

        this.emitMutation({
            AIsuggestions: { $set: newSuggestions },
        })

        this.AIpromptSuggestions = newSuggestions
    }

    saveAIPrompt: EventHandler<'saveAIPrompt'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            showAISuggestionsDropDown: { $set: true },
        })
        let suggestions = this.AIpromptSuggestions

        let newSuggestion = { prompt: event.prompt, focused: null }

        suggestions.unshift(newSuggestion)

        const newSuggestionsToSave = suggestions.map((item) => item.prompt)

        await this.syncSettings.openAI.set(
            'promptSuggestions',
            newSuggestionsToSave,
        )

        this._updateFocusAISuggestions(-1, suggestions)

        this.AIpromptSuggestions = suggestions
    }

    toggleAISuggestionsDropDown: EventHandler<
        'toggleAISuggestionsDropDown'
    > = async ({ event, previousState }) => {
        if (previousState.showAISuggestionsDropDown) {
            this._updateFocusAISuggestions(-1, previousState.AIsuggestions)
            this.emitMutation({
                showAISuggestionsDropDown: {
                    $set: false,
                },
            })
            return
        }

        const rawSuggestions = await this.syncSettings.openAI.get(
            'promptSuggestions',
        )

        let suggestions = []

        if (!rawSuggestions) {
            await this.syncSettings.openAI.set(
                'promptSuggestions',
                AI_PROMPT_DEFAULTS,
            )

            suggestions = AI_PROMPT_DEFAULTS.map((prompt: string) => {
                return { prompt, focused: null }
            })
        } else {
            suggestions = rawSuggestions.map((prompt: string) => ({
                prompt,
                focused: null,
            }))
        }

        this.emitMutation({
            showAISuggestionsDropDown: {
                $set: !previousState.showAISuggestionsDropDown,
            },
        })

        if (!previousState.showAISuggestionsDropDown) {
            this.emitMutation({
                AIsuggestions: { $set: suggestions },
            })
        }
        this.AIpromptSuggestions = suggestions
    }

    private _updateFocusAISuggestions = (
        focusIndex: number | undefined,
        displayEntries?: { prompt: string; focused: boolean }[],
        emit = true,
    ) => {
        this.focusIndex = focusIndex ?? -1
        if (!displayEntries) {
            return
        }

        for (let i = 0; i < displayEntries.length; i++) {
            displayEntries[i].focused = focusIndex === i
        }

        let suggestions = displayEntries

        this.emitMutation({
            AIsuggestions: { $set: suggestions },
        })

        if (focusIndex >= 0) {
            this.emitMutation({
                prompt: { $set: suggestions[focusIndex].prompt },
            })
        }
    }

    selectAISuggestion: EventHandler<'selectAISuggestion'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            showAISuggestionsDropDown: { $set: false },
        })

        const prompt = event.suggestion

        await this.processUIEvent('queryAIwithPrompt', {
            event: { prompt: prompt },
            previousState,
        })
    }
    navigateFocusInList: EventHandler<'navigateFocusInList'> = async ({
        event,
        previousState,
    }) => {
        const displayEntries = previousState.AIsuggestions

        if (!displayEntries) {
            return
        }

        let focusIndex

        if (this.focusIndex == null) {
            focusIndex = -1
        } else {
            focusIndex = this.focusIndex
        }

        if (event.direction === 'up') {
            if (focusIndex > 0) {
                this._updateFocusAISuggestions(focusIndex - 1, displayEntries)
            }
        }

        if (event.direction === 'down') {
            if (focusIndex < displayEntries.length - 1) {
                this._updateFocusAISuggestions(focusIndex + 1, displayEntries)
            }
        }
    }

    queryAIwithPrompt: EventHandler<'queryAIwithPrompt'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            prompt: { $set: event.prompt },
            showAISuggestionsDropDown: {
                $set: false,
            },
        })

        if (event.prompt?.length > 0 || previousState.prompt?.length > 0) {
            let isPagePDF = window.location.href.includes('/pdfjs/viewer.html?')
            let fullTextToProcess
            if (isPagePDF) {
                fullTextToProcess = document.body.innerText
            }

            if (previousState.queryMode === 'question') {
                this.queryAI(
                    undefined,
                    event.highlightedText ||
                        previousState.selectedTextAIPreview,
                    event.prompt ? event.prompt : previousState.prompt,
                    false,
                    previousState,
                    undefined,
                )
            } else if (previousState.queryMode === 'summarize') {
                this.queryAI(
                    isPagePDF ? undefined : previousState.fullPageUrl,
                    event.highlightedText ||
                        previousState.selectedTextAIPreview,
                    event.prompt ? event.prompt : previousState.prompt,
                    false,
                    previousState,
                    isPagePDF ? fullTextToProcess : undefined,
                )
            } else if (previousState.queryMode === 'glanceSummary') {
                this.queryAI(
                    isPagePDF ? undefined : previousState.fullPageUrl,
                    event.highlightedText ||
                        previousState.selectedTextAIPreview,
                    event.prompt ? event.prompt : previousState.prompt,
                    true,
                    previousState,
                    isPagePDF ? fullTextToProcess : undefined,
                )
            }
        }
    }

    setQueryMode: EventHandler<'setQueryMode'> = async ({ event }) => {
        this.emitMutation({
            queryMode: { $set: event.mode },
        })
    }

    updatePromptState: EventHandler<'updatePromptState'> = async ({
        event,
        previousState,
    }) => {
        const pattern = new RegExp(event.prompt, 'i')
        const newSuggestions = this.AIpromptSuggestions.filter((item) =>
            pattern.test(item.prompt),
        )
        if (event.prompt.length === 0) {
            this._updateFocusAISuggestions(-1, newSuggestions)
        } else {
            if (newSuggestions.length > 0) {
                this.emitMutation({
                    showAISuggestionsDropDown: { $set: true },
                })
            }
        }

        this.emitMutation({
            prompt: { $set: event.prompt },
            AIsuggestions: { $set: newSuggestions },
        })
    }

    removeSelectedTextAIPreview: EventHandler<
        'removeSelectedTextAIPreview'
    > = async () => {
        this.emitMutation({
            selectedTextAIPreview: { $set: undefined },
        })
    }

    askAIviaInPageInteractions: EventHandler<
        'askAIviaInPageInteractions'
    > = async ({ event, previousState }) => {
        this.emitMutation({ activeTab: { $set: 'summary' } })

        let prompt = 'Summarise this in 2-3 paragraphs'

        await this.processUIEvent('queryAIwithPrompt', {
            event: { prompt: prompt, highlightedText: event.textToProcess },
            previousState,
        })

        this.emitMutation({
            pageSummary: { $set: '' },
            selectedTextAIPreview: { $set: event.textToProcess },
            prompt: {
                $set: 'Summarise this in 2-3 paragraphs',
            },
        })
    }

    setActiveSidebarTab: EventHandler<'setActiveSidebarTab'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({ activeTab: { $set: event.tab } })

        // Ensure in-page selectedList state only applies when the spaces tab is active
        const returningToSelectedListMode =
            previousState.selectedListId != null && event.tab === 'spaces'
        this.options.events?.emit(
            'setSelectedList',
            returningToSelectedListMode ? previousState.selectedListId : null,
        )

        if (event.tab === 'annotations') {
            this.renderOwnHighlights(previousState)
        } else if (returningToSelectedListMode) {
            this.options.events?.emit('renderHighlights', {
                highlights: cacheUtils.getListHighlightsArray(
                    this.options.annotationsCache,
                    previousState.selectedListId,
                ),
                removeExisting: true,
            })
        } else if (event.tab === 'spaces') {
            await this.loadRemoteAnnototationReferencesForCachedLists(
                previousState,
            )
        } else if (
            event.tab === 'summary' &&
            ((event.prompt && event.prompt.length > 0) ||
                event.textToProcess.length > 0)
        ) {
            if (previousState.pageSummary.length === 0) {
                let isPagePDF = window.location.href.includes(
                    '/pdfjs/viewer.html?',
                )
                let fullTextToProcess
                if (isPagePDF) {
                    fullTextToProcess = document.body.innerText
                }
                if (event.textToProcess) {
                    this.emitMutation({
                        prompt: { $set: '' },
                    })
                    await this.queryAI(
                        undefined,
                        event.textToProcess,
                        undefined,
                        undefined,
                        previousState,
                    )
                } else {
                    this.emitMutation({
                        prompt: { $set: event.prompt },
                    })
                    await this.queryAI(
                        isPagePDF ? undefined : previousState.fullPageUrl,
                        undefined,
                        undefined,
                        previousState.queryMode === 'glanceSummary'
                            ? true
                            : false,
                        previousState,
                        isPagePDF ? fullTextToProcess : undefined,
                    )
                }
            }
        }
    }

    private async maybeLoadListRemoteAnnotations(
        state: SidebarContainerState,
        unifiedListId: UnifiedList['unifiedId'],
    ): Promise<SidebarContainerState> {
        const { annotationsCache, annotationsBG } = this.options
        const list = state.lists.byId[unifiedListId]
        const listInstance = state.listInstances[unifiedListId]
        let nextState = state

        if (
            !list ||
            !listInstance ||
            list.remoteId == null ||
            listInstance.annotationsLoadState !== 'pristine' // Means already loaded previously
        ) {
            return nextState
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

            nextState = this.applyAndEmitMutation(nextState, {
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

                    // Ensure cache added annotations are set in latest state
                    nextState = {
                        ...nextState,
                        annotations: annotationsCache.annotations,
                    }

                    nextState = this.applyAndEmitMutation(nextState, {
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
        return nextState
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

        // NOTE: It's important the annots+lists states are gotten from the cache here as the above async call
        //   can result in new annotations being added to the cache which won't yet update this logic class' state
        //   (though they cache's state will be up-to-date)
        this.renderOpenSpaceInstanceHighlights({
            annotations: this.options.annotationsCache.annotations,
            lists: this.options.annotationsCache.lists,
            listInstances: nextState.listInstances,
        })
        await this.maybeLoadListRemoteAnnotations(
            previousState,
            event.unifiedListId,
        )
    }

    setSpaceTitleEditValue: EventHandler<'setSpaceTitleEditValue'> = ({
        event,
    }) => {
        this.emitMutation({
            spaceTitleEditValue: { $set: event.value },
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
    ): Promise<SidebarContainerState> {
        this.options.events?.emit('setSelectedList', unifiedListId)

        const list = state.lists.byId[unifiedListId]
        const listInstance = state.listInstances[unifiedListId]
        if (!list || !listInstance) {
            console.warn(
                'setSelectedList: could not find matching list for cache ID:',
                unifiedListId,
            )
            return state
        }

        const listTitle = list.name

        let nextState = this.applyAndEmitMutation(state, {
            activeTab: { $set: 'spaces' },
            selectedListId: { $set: unifiedListId },
            spaceTitleEditValue: { $set: listTitle },
        })

        this.options.events?.emit('renderHighlights', {
            highlights: cacheUtils.getListHighlightsArray(
                this.options.annotationsCache,
                unifiedListId,
            ),
            removeExisting: true,
        })

        if (list.remoteId != null) {
            nextState = await this.loadRemoteAnnotationReferencesForSpecificLists(
                nextState,
                [list],
            )
            nextState = await this.maybeLoadListRemoteAnnotations(
                nextState,
                unifiedListId,
            )
        }
        return nextState
    }

    createYoutubeTimestampWithScreenshot: EventHandler<
        'createYoutubeTimestampWithScreenshot'
    > = async ({ previousState, event }) => {
        this.emitMutation({
            loadState: { $set: 'success' },
            activeTab: { $set: 'annotations' },
        })
        this.options.focusCreateForm()

        const maxRetries = 50
        let handledSuccessfully = false

        for (let i = 0; i < maxRetries; i++) {
            if (
                this.options.events.emit(
                    'addImageToEditor',
                    {
                        imageData: event.imageData,
                    },
                    (success) => {
                        handledSuccessfully = success
                    },
                )
            ) {
                break
            }
            await sleepPromise(50) // wait for half a second before trying again
        }
    }

    createYoutubeTimestampWithAISummary: EventHandler<
        'createYoutubeTimestampWithAISummary'
    > = async ({ previousState, event }) => {
        this.emitMutation({
            loadState: { $set: 'success' },
            activeTab: { $set: 'annotations' },
        })
        this.options.focusCreateForm()
        this.emitMutation({
            commentBox: {
                commentText: { $set: '' },
            },
            pageSummary: { $set: '' },
            prompt: { $set: null },
        })
        // is here bc for some reason else the timestamps will not be pushed, seems like a race condition

        await sleepPromise(0)
        const timestampToInsert = event.timeStampANDSummaryJSON[0]

        const maxRetries = 30
        let handledSuccessfully = false

        for (let i = 0; i < maxRetries; i++) {
            if (
                this.options.events.emit(
                    'triggerYoutubeTimestampSummary',
                    {
                        text: timestampToInsert + ' ',
                        showLoadingSpinner: true,
                    },
                    (success) => {
                        handledSuccessfully = success
                    },
                )
            ) {
                break
            }
            await sleepPromise(50) // wait for half a second before trying again
        }

        const filteredSegments = JSON.parse(event.timeStampANDSummaryJSON[1])

        const combinedText = filteredSegments.map((item) => item.text).join(' ')

        let prompt =
            'The following text an excerpt of an auto-generated video transcript. Please refer to it as "video sections" or "video" and not as text when talking about it. Also, the transcript will contain transcription errors. Please correct and output it as much as possible and keep it in its original meaning. Try to be short and conscise as the purpose of this summary is to help people to mark a video section and what it was saying. Do not use any lists as outputs: '

        await this.queryAI(
            undefined,
            combinedText,
            prompt,
            undefined,
            previousState,
            null,
            'editor',
        )

        this.emitMutation({
            pageSummary: { $set: '' },
            prompt: { $set: null },
            selectedTextAIPreview: {
                $set: '',
            },
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

        this.emitMutation({})
    }

    setSelectedListFromWebUI: EventHandler<
        'setSelectedListFromWebUI'
    > = async ({ event, previousState }) => {
        let nextState = this.applyAndEmitMutation(previousState, {
            activeTab: { $set: 'spaces' },
            loadState: { $set: 'running' },
        })
        await this.options.storageAPI.local.set({
            '@Sidebar-reading_view': true,
        })

        const { annotationsCache, customListsBG } = this.options

        const normalizedPageUrl = normalizeUrl(this.fullPageUrl)
        const cachedList = annotationsCache.getListByRemoteId(
            event.sharedListId,
        )

        // If locally available, proceed as usual
        if (cachedList) {
            nextState = await this.setLocallyAvailableSelectedList(
                nextState,
                cachedList.unifiedId,
            )
            nextState = this.applyAndEmitMutation(nextState, {
                loadState: { $set: 'success' },
            })

            // This covers the case where the associated followedListEntry hasn't been synced yet (via periodic sync, not cloud sync)
            //  for a newly joined page link list
            if (
                event.manuallyPullLocalListData &&
                cachedList.type === 'page-link' &&
                !cachedList.sharedListEntryId
            ) {
                const localData = await customListsBG.fetchLocalDataForRemoteListEntryFromServer(
                    {
                        remoteListId: event.sharedListId,
                        normalizedPageUrl,
                        opts: { needAnnotsFlag: true },
                    },
                )

                if (localData == null) {
                    return
                }

                annotationsCache.updateList({
                    normalizedPageUrl,
                    unifiedId: cachedList.unifiedId,
                    sharedListEntryId: localData.sharedListEntryId,
                    hasRemoteAnnotationsToLoad:
                        localData.hasAnnotationsFromOthers,
                })
                await this.maybeLoadListRemoteAnnotations(
                    { ...nextState, lists: annotationsCache.lists },
                    cachedList.unifiedId,
                )
            }

            this.options.events?.emit('renderHighlights', {
                highlights: cacheUtils.getListHighlightsArray(
                    annotationsCache,
                    cachedList.unifiedId,
                ),
                removeExisting: true,
            })
            return
        }

        if (!this.fullPageUrl) {
            throw new Error(
                'Could not load remote list data for selected list mode without `props.fullPageUrl` being set in sidebar',
            )
        }

        // Else we're dealing with a foreign list which we need to load remotely
        await executeUITask(this, 'foreignSelectedListLoadState', async () => {
            const sharedList = await customListsBG.fetchSharedListDataWithPageAnnotations(
                {
                    remoteListId: event.sharedListId,
                    normalizedPageUrl,
                },
            )
            if (!sharedList) {
                throw new Error(
                    `Could not load remote list data for selected list mode - ID: ${event.sharedListId}`,
                )
            }

            let localListData: {
                localListId?: number
                sharedListEntryId: AutoPk
            }
            if (event.manuallyPullLocalListData) {
                localListData = await customListsBG.fetchLocalDataForRemoteListEntryFromServer(
                    {
                        remoteListId: event.sharedListId,
                        normalizedPageUrl,
                        opts: { needLocalListd: true },
                    },
                )
                if (!localListData) {
                    throw new Error(
                        'Could not find data for local list on cloud',
                    )
                }
                this.emitMutation({
                    hasListDataBeenManuallyPulled: { $set: true },
                })
            }

            let unifiedListId: string
            const listCommon = {
                remoteId: event.sharedListId,
                name: sharedList.title,
                creator: sharedList.creator,
                description: sharedList.description,
                localId: localListData?.localListId ?? undefined,
                isForeignList: localListData == null,
                hasRemoteAnnotationsToLoad:
                    sharedList.sharedAnnotations == null ? false : true,
                unifiedAnnotationIds: [], // Will be populated soon when annots get cached
            }

            if (sharedList.type === 'page-link') {
                const { unifiedId } = annotationsCache.addList<'page-link'>({
                    type: 'page-link',
                    ...listCommon,
                    normalizedPageUrl,
                    sharedListEntryId: localListData?.sharedListEntryId.toString(),
                })
                unifiedListId = unifiedId
            } else {
                const { unifiedId } = annotationsCache.addList<'user-list'>({
                    type: 'user-list',
                    ...listCommon,
                })
                unifiedListId = unifiedId
            }

            this.options.events?.emit('setSelectedList', unifiedListId)

            const buildCoreMutation = (
                sharedAnnotationReferences: SharedAnnotationReference[],
            ): UIMutation<SidebarContainerState> => ({
                loadState: { $set: 'success' },
                selectedListId: { $set: unifiedListId },
                // NOTE: this is the only time we're manually mutating the listInstances state outside the cache subscription - maybe there's a "cleaner" way to do this
                listInstances: {
                    [unifiedListId]: {
                        annotationRefsLoadState: { $set: 'success' },
                        conversationsLoadState: { $set: 'success' },
                        annotationsLoadState: { $set: 'success' },
                        sharedAnnotationReferences: {
                            $set: sharedAnnotationReferences,
                        },
                    },
                },
            })

            if (sharedList.sharedAnnotations == null) {
                this.emitMutation(buildCoreMutation([]))
                return
            }

            const sharedAnnotationUnifiedIds: string[] = []
            const sharedAnnotationReferences: SharedAnnotationReference[] = []
            for (const sharedAnnot of sharedList.sharedAnnotations) {
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
                    unifiedListIds: [unifiedListId],
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    localListIds: [],
                })
                sharedAnnotationUnifiedIds.push(unifiedId)
                sharedAnnotationReferences.push(sharedAnnot.reference)
            }

            this.emitMutation({
                ...buildCoreMutation(sharedAnnotationReferences),
                conversations: {
                    $merge: fromPairs(
                        sharedAnnotationUnifiedIds.map((unifiedId) => [
                            generateAnnotationCardInstanceId(
                                { unifiedId },
                                unifiedListId,
                            ),
                            getInitialAnnotationConversationState(),
                        ]),
                    ),
                },
            })

            this.options.events?.emit('renderHighlights', {
                highlights: cacheUtils.getListHighlightsArray(
                    annotationsCache,
                    unifiedListId,
                ),
                removeExisting: true,
            })

            await this.detectConversationThreads(
                unifiedListId,
                event.sharedListId,
                sharedAnnotationReferences,
            )
        })
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

    setSharingTutorialVisibility: EventHandler<
        'setSharingTutorialVisibility'
    > = async ({ previousState, event }) => {
        const hasEverSharedPageLink = await browser.storage.local.get(
            'hasEverSharedPageLink',
        )

        if (!hasEverSharedPageLink.hasEverSharedPageLink) {
            await browser.storage.local.set({ hasEverSharedPageLink: true })
            this.emitMutation({
                firstTimeSharingPageLink: { $set: true },
            })
            this.emitMutation({
                firstTimeSharingPageLink: {
                    $set: true,
                },
            })
        } else {
            this.emitMutation({
                firstTimeSharingPageLink: {
                    $set: false,
                },
            })
        }
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

    createPageLink: EventHandler<'createPageLink'> = async ({
        previousState,
        event,
    }) => {
        const fullPageUrl = previousState.fullPageUrl

        if (!fullPageUrl) {
            throw new Error(
                'Cannot create page link - Page URL sidebar state not set',
            )
        }
        const currentUser = this.options.getCurrentUser()
        if (!currentUser) {
            throw new Error('Cannot create page link - User not logged in')
        }

        let title

        if (window.location.href.includes('web.telegram.org')) {
            title = getTelegramUserDisplayName(document, window.location.href)
        }

        this.emitMutation({
            showSharePageTooltip: { $set: true },
        })

        const existingPageLink = this.options.annotationsCache.getSharedPageListIds(
            normalizeUrl(fullPageUrl),
        )

        if (existingPageLink.length > 0) {
            this.emitMutation({
                showSharePageTooltip: { $set: true },
            })
            this.emitMutation({
                selectedListForShareMenu: {
                    $set: existingPageLink[existingPageLink.length - 1],
                },
            })
            if (!event.forceCreate) {
                return
            }
        }

        await executeUITask(this, 'pageLinkCreateState', async () => {
            const {
                collabKey,
                listTitle,
                localListId,
                remoteListId,
                remoteListEntryId,
            } = await this.options.contentSharingByTabsBG.schedulePageLinkCreation(
                {
                    fullPageUrl,
                    customPageTitle: title,
                },
            )

            const cacheListData: UnifiedListForCache<'page-link'> = {
                type: 'page-link',
                name: listTitle,
                creator: currentUser,
                localId: localListId,
                collabKey: collabKey.toString(),
                remoteId: remoteListId.toString(),
                sharedListEntryId: remoteListEntryId.toString(),
                normalizedPageUrl: normalizeUrl(fullPageUrl),
                unifiedAnnotationIds: [],
                hasRemoteAnnotationsToLoad: false,
            }
            const { unifiedId } = this.options.annotationsCache.addList(
                cacheListData,
            )

            this.emitMutation({
                selectedListForShareMenu: { $set: unifiedId },
            })

            await Promise.all([
                this.options.contentSharingByTabsBG.waitForPageLinkCreation({
                    fullPageUrl,
                }),
                this.setLocallyAvailableSelectedList(
                    {
                        ...previousState,
                        lists: this.options.annotationsCache.lists,
                        listInstances: {
                            ...previousState.listInstances,
                            [unifiedId]: initListInstance({
                                ...cacheListData,
                                unifiedId,
                            }),
                        },
                    },
                    unifiedId,
                ),
            ])
        })
    }
}
