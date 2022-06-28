import { UILogic, UIEventHandler, UIMutation } from 'ui-logic-core'
import debounce from 'lodash/debounce'
import { AnnotationPrivacyState } from '@worldbrain/memex-common/lib/annotations/types'

import * as utils from './search-results/util'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import { RootState as State, DashboardDependencies, Events } from './types'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

import { haveArraysChanged } from 'src/util/have-tags-changed'
import {
    PAGE_SIZE,
    STORAGE_KEYS,
    PAGE_SEARCH_DUMMY_DAY,
    MISSING_PDF_QUERY_PARAM,
} from 'src/dashboard-refactor/constants'
import { STORAGE_KEYS as CLOUD_STORAGE_KEYS } from 'src/personal-cloud/constants'
import { ListData } from './lists-sidebar/types'
import {
    updatePickerValues,
    stateToSearchParams,
    flattenNestedResults,
} from './util'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { NoResultsType } from './search-results/types'
import { filterListsByQuery } from './lists-sidebar/util'
import { DRAG_EL_ID } from './components/DragElement'
import { mergeNormalizedStates } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import {
    getRemoteEventEmitter,
    TypedRemoteEventEmitter,
} from 'src/util/webextensionRPC'
import {
    SyncSettingsStore,
    createSyncSettingsStore,
} from 'src/sync-settings/util'
import {
    createAnnotation,
    updateAnnotation,
} from 'src/annotations/annotation-save-logic'
import { isDuringInstall } from 'src/overview/onboarding/utils'
import { AnnotationSharingStates } from 'src/content-sharing/background/types'
import { getAnnotationPrivacyState } from '@worldbrain/memex-common/lib/content-sharing/utils'
import { ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY } from 'src/activity-indicator/constants'
import { validateSpaceName } from '@worldbrain/memex-common/lib/utils/space-name-validation'

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

/**
 * Helper used to build a mutation to remove a page from all results days in which it occurs.
 */
export const removeAllResultOccurrencesOfPage = (
    state: State['searchResults']['results'],
    pageId: string,
): UIMutation<State['searchResults']['results']> => {
    const mutation: UIMutation<State['searchResults']['results']> = {}

    for (const { day, pages } of Object.values(state)) {
        if (!pages.allIds.includes(pageId)) {
            continue
        }

        // If it's the last remaining page for this day, remove the day instead
        if (pages.allIds.length === 1) {
            mutation['$unset'] = [...(mutation['$unset'] ?? []), day]
            continue
        }

        mutation[day] = {
            pages: {
                byId: { $unset: [pageId] },
                allIds: {
                    $set: state[day].pages.allIds.filter((id) => id !== pageId),
                },
            },
        }
    }

    return mutation
}

export class DashboardLogic extends UILogic<State, Events> {
    personalCloudEvents: TypedRemoteEventEmitter<'personalCloud'>
    syncSettings: SyncSettingsStore<
        'contentSharing' | 'dashboard' | 'extension'
    >

    constructor(private options: DashboardDependencies) {
        super()
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: options.syncSettingsBG,
        })
    }

    private setupRemoteEventListeners() {
        this.personalCloudEvents = getRemoteEventEmitter('personalCloud')
        this.personalCloudEvents.on('cloudStatsUpdated', ({ stats }) => {
            this.emitMutation({
                syncMenu: {
                    pendingLocalChangeCount: { $set: stats.pendingUploads },
                    pendingRemoteChangeCount: { $set: stats.pendingDownloads },
                },
            })
        })
    }

    getInitialState(): State {
        let mode: State['mode'] = 'search'
        if (isDuringInstall(this.options.location)) {
            mode = 'onboarding'
        } else if (
            this.options.location.href.includes(MISSING_PDF_QUERY_PARAM)
        ) {
            mode = 'locate-pdf'
            this.options.pdfViewerBG.openPdfViewerForNextPdf()
        }

        return {
            mode,
            loadState: 'pristine',
            isCloudEnabled: true,
            currentUser: null,
            modals: {
                showLogin: false,
                showSubscription: false,
                showCloudOnboarding: false,
                showDisplayNameSetup: false,
                showNoteShareOnboarding: false,
                confirmPrivatizeNoteArgs: null,
                confirmSelectNoteSpaceArgs: null,
            },
            searchResults: {
                results: {},
                noResultsType: null,
                showMobileAppAd: false,
                shouldShowTagsUIs: false,
                showOnboardingMsg: false,
                areResultsExhausted: false,
                shouldFormsAutoFocus: false,
                isListShareMenuShown: false,
                isSortMenuShown: false,
                isSearchCopyPasterShown: false,
                isCloudUpgradeBannerShown: false,
                isSubscriptionBannerShown: false,
                pageData: {
                    allIds: [],
                    byId: {},
                },
                noteData: {
                    allIds: [],
                    byId: {},
                },
                searchType: 'pages',
                searchState: 'pristine',
                noteDeleteState: 'pristine',
                pageDeleteState: 'pristine',
                paginationState: 'pristine',
                noteUpdateState: 'pristine',
                newNoteCreateState: 'pristine',
                searchPaginationState: 'pristine',
            },
            searchFilters: {
                searchQuery: '',
                domainsExcluded: [],
                domainsIncluded: [],
                isDateFilterActive: false,
                isSpaceFilterActive: false,
                isDomainFilterActive: false,
                isTagFilterActive: false,
                searchFiltersOpen: false,
                spacesIncluded: [],
                tagsExcluded: [],
                tagsIncluded: [],
                dateFromInput: '',
                dateToInput: '',
                limit: PAGE_SIZE,
                skip: 0,
            },
            listsSidebar: {
                addListErrorMessage: null,
                editListErrorMessage: null,
                listShareLoadingState: 'pristine',
                listCreateState: 'pristine',
                listDeleteState: 'pristine',
                listEditState: 'pristine',
                isSidebarPeeking: false,
                isSidebarLocked: false,
                hasFeedActivity: false,
                inboxUnreadCount: 0,
                searchQuery: '',
                listData: {},
                followedLists: {
                    loadingState: 'pristine',
                    isExpanded: true,
                    allListIds: [],
                    filteredListIds: [],
                },
                localLists: {
                    isAddInputShown: false,
                    loadingState: 'pristine',
                    isExpanded: true,
                    allListIds: [],
                    filteredListIds: [],
                },
            },
            syncMenu: {
                isDisplayed: false,
                pendingLocalChangeCount: 0,
                pendingRemoteChangeCount: 0,
                lastSuccessfulSyncDate: null,
            },
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        this.setupRemoteEventListeners()

        await loadInitial(this, async () => {
            let nextState = await this.loadAuthStates(previousState)
            nextState = await this.hydrateStateFromLocalStorage(nextState)
            const localListsResult = await this.loadLocalListsData(nextState)
            nextState = localListsResult.nextState
            await Promise.all([
                this.loadRemoteListsData(localListsResult.remoteToLocalIdDict),
                this.getFeedActivityStatus(),
                this.getInboxUnreadCount(),
                this.runSearch(nextState),
            ])
        })
    }

    cleanup: EventHandler<'cleanup'> = async ({}) => {
        this.personalCloudEvents.removeAllListeners()
    }

    /* START - Misc helper methods */
    private async hydrateStateFromLocalStorage(
        previousState: State,
    ): Promise<State> {
        const { personalCloudBG, localStorage } = this.options
        const {
            [CLOUD_STORAGE_KEYS.lastSeen]: cloudLastSynced,
            [STORAGE_KEYS.mobileAdSeen]: mobileAdSeen,
        } = await localStorage.get([
            CLOUD_STORAGE_KEYS.lastSeen,
            STORAGE_KEYS.mobileAdSeen,
        ])

        const isCloudEnabled = await personalCloudBG.isCloudSyncEnabled()
        const [
            listsSidebarLocked,
            onboardingMsgSeen,
            subBannerShownAfter,
            areTagsMigrated,
        ] = await Promise.all([
            this.syncSettings.dashboard.get('listSidebarLocked'),
            this.syncSettings.dashboard.get('onboardingMsgSeen'),
            this.syncSettings.dashboard.get('subscribeBannerShownAfter'),
            this.syncSettings.extension.get('areTagsMigratedToSpaces'),
        ])

        const mutation: UIMutation<State> = {
            isCloudEnabled: { $set: isCloudEnabled },
            searchResults: {
                showMobileAppAd: { $set: !mobileAdSeen },
                shouldShowTagsUIs: { $set: !areTagsMigrated },
                showOnboardingMsg: { $set: !onboardingMsgSeen },
                isCloudUpgradeBannerShown: { $set: !isCloudEnabled },
                isSubscriptionBannerShown: {
                    $set:
                        subBannerShownAfter != null &&
                        subBannerShownAfter < Date.now(),
                },
            },
            listsSidebar: {
                isSidebarLocked: { $set: listsSidebarLocked ?? true },
            },
            syncMenu: {
                lastSuccessfulSyncDate: {
                    $set:
                        cloudLastSynced == null
                            ? null
                            : new Date(cloudLastSynced),
                },
            },
        }
        this.emitMutation(mutation)
        return this.withMutation(previousState, mutation)
    }

    private async getFeedActivityStatus() {
        const hasActivityStored = await getLocalStorage(
            ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY,
        )
        if (hasActivityStored === true) {
            this.emitMutation({
                listsSidebar: {
                    hasFeedActivity: { $set: true },
                },
            })
        } else {
            const activityStatus = await this.options.activityIndicatorBG.checkActivityStatus()
            await setLocalStorage(
                ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY,
                activityStatus === 'has-unseen',
            )
            this.emitMutation({
                listsSidebar: {
                    hasFeedActivity: { $set: activityStatus === 'has-unseen' },
                },
            })
        }
    }

    checkSharingAccess: EventHandler<'checkSharingAccess'> = async ({
        previousState,
    }) => {
        await this.loadAuthStates(previousState)
    }

    private async loadAuthStates(previousState: State): Promise<State> {
        const { authBG } = this.options
        const user = await authBG.getCurrentUser()

        const mutation: UIMutation<State> = {
            currentUser: { $set: user },
        }

        const nextState = this.withMutation(previousState, mutation)
        this.emitMutation(mutation)
        return nextState
    }

    private async getInboxUnreadCount() {
        this.emitMutation({
            listsSidebar: {
                inboxUnreadCount: {
                    $set: await this.options.listsBG.getInboxUnreadCount(),
                },
            },
        })
    }

    private async loadLocalListsData(previousState: State) {
        const { listsBG, contentShareBG } = this.options

        const remoteToLocalIdDict: { [remoteId: string]: number } = {}
        const mutation: UIMutation<State> = {}

        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: {
                    localLists: { loadingState: { $set: taskState } },
                },
            }),
            async () => {
                let localLists = await listsBG.fetchAllLists({
                    limit: 1000,
                    skipMobileList: true,
                })

                const localToRemoteIdDict = await contentShareBG.getRemoteListIds(
                    { localListIds: localLists.map((list) => list.id) },
                )

                const listIds: number[] = []
                const listData: { [id: number]: ListData } = {}

                localLists = localLists.sort((listDataA, listDataB) => {
                    if (listDataA.name < listDataB.name) {
                        return -1
                    }
                    if (listDataA.name > listDataB.name) {
                        return 1
                    }
                    return 0
                })

                for (const list of localLists) {
                    const remoteId = localToRemoteIdDict[list.id]
                    if (remoteId) {
                        remoteToLocalIdDict[remoteId] = list.id
                    }
                    listIds.push(list.id)
                    listData[list.id] = {
                        remoteId,
                        id: list.id,
                        name: list.name,
                        isOwnedList: true,
                    }
                }

                mutation.listsSidebar = {
                    listData: { $merge: listData },
                    localLists: {
                        allListIds: { $set: listIds },
                        filteredListIds: { $set: listIds },
                    },
                }
                this.emitMutation(mutation)
            },
        )

        return {
            nextState: this.withMutation(previousState, mutation),
            remoteToLocalIdDict,
        }
    }

    private async loadRemoteListsData(remoteToLocalIdDict: {
        [remoteId: string]: number
    }) {
        const { listsBG } = this.options

        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: {
                    followedLists: { loadingState: { $set: taskState } },
                },
            }),
            async () => {
                const followedLists = await listsBG.fetchAllFollowedLists({
                    limit: 1000,
                })
                const followedListIds: number[] = []
                const listData: { [id: number]: ListData } = {}

                for (const list of followedLists) {
                    const localId =
                        remoteToLocalIdDict[list.remoteId] ?? list.id

                    // Joined lists appear in "Local lists" section, so don't include them here
                    if (!remoteToLocalIdDict[list.remoteId]) {
                        followedListIds.push(localId)
                    }

                    listData[localId] = {
                        id: localId,
                        name: list.name,
                        remoteId: list.remoteId,
                        isOwnedList: list.isOwned,
                    }
                }

                this.emitMutation({
                    listsSidebar: {
                        listData: { $merge: listData },
                        followedLists: {
                            allListIds: { $set: followedListIds },
                            filteredListIds: { $set: followedListIds },
                        },
                    },
                })
            },
        )
    }

    /**
     * Helper which emits a mutation followed by a search using the post-mutation state.
     */
    private async mutateAndTriggerSearch(
        previousState: State,
        mutation: UIMutation<State>,
    ) {
        this.emitMutation({ ...mutation, mode: { $set: 'search' } })
        const nextState = this.withMutation(previousState, mutation)
        await this.runSearch(nextState)
    }

    private runSearch = debounce(
        (previousState: State, paginate?: boolean) =>
            this.search({ previousState, event: { paginate } }),
        300,
    )
    /* END - Misc helper methods */

    /* START - Misc event handlers */
    search: EventHandler<'search'> = async ({ previousState, event }) => {
        const searchFilters: UIMutation<State['searchFilters']> = {
            skip: event.paginate
                ? { $apply: (skip) => skip + PAGE_SIZE }
                : { $set: 0 },
        }

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: {
                    [event.paginate
                        ? 'searchPaginationState'
                        : 'searchState']: { $set: taskState },
                },
            }),
            async () => {
                const searchState = this.withMutation(previousState, {
                    searchFilters,
                })
                let {
                    noteData,
                    pageData,
                    results,
                    resultsExhausted,
                    searchTermsInvalid,
                } =
                    previousState.searchResults.searchType === 'pages'
                        ? await this.searchPages(searchState)
                        : await this.searchNotes(searchState)

                let noResultsType: NoResultsType = null
                if (
                    resultsExhausted &&
                    searchState.searchFilters.skip === 0 &&
                    !pageData.allIds.length
                ) {
                    if (
                        previousState.listsSidebar.selectedListId ===
                        SPECIAL_LIST_IDS.MOBILE
                    ) {
                        noResultsType = previousState.searchResults
                            .showMobileAppAd
                            ? 'mobile-list-ad'
                            : 'mobile-list'
                    } else if (previousState.searchResults.showOnboardingMsg) {
                        noResultsType = 'onboarding-msg'
                    } else {
                        noResultsType = searchTermsInvalid
                            ? 'stop-words'
                            : 'no-results'
                    }
                }

                this.emitMutation({
                    searchFilters,
                    searchResults: {
                        areResultsExhausted: {
                            $set: resultsExhausted,
                        },
                        noResultsType: { $set: noResultsType },
                        ...(event.paginate
                            ? {
                                  results: {
                                      $apply: (prev) =>
                                          utils.mergeSearchResults(
                                              prev,
                                              results,
                                          ),
                                  },
                                  pageData: {
                                      $apply: (prev) =>
                                          mergeNormalizedStates(prev, pageData),
                                  },
                                  noteData: {
                                      $apply: (prev) =>
                                          mergeNormalizedStates(prev, noteData),
                                  },
                              }
                            : {
                                  results: { $set: results },
                                  pageData: { $set: pageData },
                                  noteData: { $set: noteData },
                              }),
                    },
                })
            },
        )
    }

    private searchPages = async (state: State) => {
        const result = await this.options.searchBG.searchPages(
            stateToSearchParams(state),
        )

        return {
            ...utils.pageSearchResultToState(result),
            resultsExhausted: result.resultsExhausted,
            searchTermsInvalid: result.isBadTerm,
        }
    }

    private searchNotes = async (state: State) => {
        const result = await this.options.searchBG.searchAnnotations(
            stateToSearchParams(state),
        )

        return {
            ...utils.annotationSearchResultToState(result),
            resultsExhausted: result.resultsExhausted,
            searchTermsInvalid: result.isBadTerm,
        }
    }

    private async ensureLoggedIn(): Promise<boolean> {
        const { authBG } = this.options

        const user = await authBG.getCurrentUser()
        if (user != null) {
            this.emitMutation({ currentUser: { $set: user } })

            const userProfile = await authBG.getUserProfile()
            if (!userProfile?.displayName?.length) {
                this.emitMutation({
                    modals: { showDisplayNameSetup: { $set: true } },
                })
                return false
            }

            return true
        }

        this.emitMutation({
            currentUser: { $set: null },
            modals: { showLogin: { $set: true } },
        })
        return false
    }
    /* END - Misc event handlers */

    /* START - modal event handlers */
    setShareListId: EventHandler<'setShareListId'> = async ({
        event: { listId },
    }) => {
        if (!listId) {
            this.emitMutation({
                modals: { shareListId: { $set: undefined } },
            })
            return
        }
        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: { listShareLoadingState: { $set: taskState } },
            }),
            async () => {
                if (!(await this.ensureLoggedIn())) {
                    return
                }

                const remoteListId = await this.options.contentShareBG.getRemoteListId(
                    { localListId: listId },
                )

                this.emitMutation({
                    modals: {
                        shareListId: { $set: listId },
                    },
                    listsSidebar: {
                        showMoreMenuListId: { $set: undefined },
                        listData: {
                            [listId]: {
                                remoteId: { $set: remoteListId ?? undefined },
                            },
                        },
                    },
                })
            },
        )
    }

    setShowLoginModal: EventHandler<'setShowLoginModal'> = ({ event }) => {
        this.emitMutation({
            modals: {
                showLogin: { $set: event.isShown },
            },
        })
    }

    setShowDisplayNameSetupModal: EventHandler<
        'setShowDisplayNameSetupModal'
    > = ({ event }) => {
        this.emitMutation({
            modals: {
                showDisplayNameSetup: { $set: event.isShown },
            },
        })
    }

    setShowSubscriptionModal: EventHandler<'setShowSubscriptionModal'> = ({
        event,
    }) => {
        this.emitMutation({
            modals: {
                showSubscription: { $set: event.isShown },
            },
        })
    }

    setShowNoteShareOnboardingModal: EventHandler<
        'setShowNoteShareOnboardingModal'
    > = ({ event }) => {
        this.emitMutation({
            modals: {
                showNoteShareOnboarding: { $set: event.isShown },
            },
        })
    }

    setShowCloudOnboardingModal: EventHandler<
        'setShowCloudOnboardingModal'
    > = ({ event, previousState }) => {
        if (previousState.currentUser == null) {
            this.emitMutation({
                modals: { showLogin: { $set: true } },
            })
            return
        }

        this.emitMutation({
            modals: {
                showCloudOnboarding: { $set: event.isShown },
            },
        })
    }
    /* END - modal event handlers */

    /* START - search result event handlers */
    setPageSearchResult: EventHandler<'setPageSearchResult'> = ({ event }) => {
        const state = utils.pageSearchResultToState(event.result)
        this.emitMutation({
            searchResults: {
                results: { $set: state.results },
                pageData: { $set: state.pageData },
                noteData: { $set: state.noteData },
            },
        })
    }

    setAnnotationSearchResult: EventHandler<'setAnnotationSearchResult'> = ({
        event,
    }) => {
        const state = utils.annotationSearchResultToState(event.result)
        this.emitMutation({
            searchResults: {
                results: { $set: state.results },
                pageData: { $set: state.pageData },
                noteData: { $set: state.noteData },
            },
        })
    }

    setPageTags: EventHandler<'setPageTags'> = async ({ event }) => {
        this.emitMutation({
            searchResults: {
                pageData: {
                    byId: {
                        [event.id]: {
                            tags: { $apply: updatePickerValues(event) },
                        },
                    },
                },
            },
        })

        await this.options.tagsBG.updateTagForPage({
            url: event.fullPageUrl,
            deleted: event.deleted,
            added: event.added,
        })
    }

    setPageLists: EventHandler<'setPageLists'> = async ({
        event,
        previousState,
    }) => {
        const removingSharedList =
            previousState.listsSidebar.listData[event.added ?? event.deleted]
                ?.remoteId != null && event.added == null

        const noteDataMutation: UIMutation<
            State['searchResults']['noteData']['byId']
        > = {}

        // If we're removing a shared list, we also need to make sure it gets removed from children annots
        if (removingSharedList) {
            const childrenNoteIds = flattenNestedResults(previousState).byId[
                event.id
            ].noteIds.user

            for (const noteId of childrenNoteIds) {
                noteDataMutation[noteId] = {
                    lists: { $apply: updatePickerValues(event) },
                }
            }
        }

        this.emitMutation({
            searchResults: {
                noteData: { byId: noteDataMutation },
                pageData: {
                    byId: {
                        [event.id]: {
                            lists: { $apply: updatePickerValues(event) },
                        },
                    },
                },
            },
        })

        await this.options.listsBG.updateListForPage({
            url: event.fullPageUrl,
            added: event.added,
            deleted: event.deleted,
            skipPageIndexing: true,
        })
    }

    setDeletingPageArgs: EventHandler<'setDeletingPageArgs'> = async ({
        event,
    }) => {
        this.emitMutation({
            modals: { deletingPageArgs: { $set: event } },
        })
    }

    setPrivatizeNoteConfirmArgs: EventHandler<
        'setPrivatizeNoteConfirmArgs'
    > = async ({ event }) => {
        this.emitMutation({
            modals: { confirmPrivatizeNoteArgs: { $set: event } },
        })
    }

    setSelectNoteSpaceConfirmArgs: EventHandler<
        'setSelectNoteSpaceConfirmArgs'
    > = async ({ event }) => {
        this.emitMutation({
            modals: { confirmSelectNoteSpaceArgs: { $set: event } },
        })
    }

    dragPage: EventHandler<'dragPage'> = async ({ event, previousState }) => {
        const crt = this.options.document.getElementById(DRAG_EL_ID)
        crt.style.display = 'block'
        event.dataTransfer.setDragImage(crt, 10, 10)

        const page = previousState.searchResults.pageData.byId[event.pageId]
        event.dataTransfer.setData(
            'text/plain',
            JSON.stringify({
                fullPageUrl: page.fullUrl,
                normalizedPageUrl: page.normalizedUrl,
            }),
        )
        this.emitMutation({
            searchResults: { draggedPageId: { $set: event.pageId } },
        })
    }

    dropPage: EventHandler<'dropPage'> = async () => {
        this.emitMutation({
            searchResults: { draggedPageId: { $set: undefined } },
        })
    }

    private updateBulkNotesShareInfoFromShareState = (params: {
        previousState: State
        shareStates: AnnotationSharingStates
    }) => {
        const mutation: UIMutation<State['searchResults']['noteData']> = {}

        for (const [noteId, shareState] of Object.entries(params.shareStates)) {
            if (
                params.previousState.searchResults.noteData.byId[noteId]
                    ?.isBulkShareProtected
            ) {
                continue
            }

            const privacyState = getAnnotationPrivacyState(
                shareState.privacyLevel,
            )
            mutation.byId = {
                ...(mutation.byId ?? {}),
                [noteId]: {
                    isShared: { $set: privacyState.public },
                    isBulkShareProtected: { $set: privacyState.protected },
                },
            }
        }

        this.emitMutation({ searchResults: { noteData: mutation } })
    }

    updateAllPageResultNotesShareInfo: EventHandler<
        'updateAllPageResultNotesShareInfo'
    > = async ({ event, previousState }) => {
        this.updateBulkNotesShareInfoFromShareState({
            previousState,
            shareStates: event.shareStates,
        })
    }

    updatePageNotesShareInfo: EventHandler<
        'updatePageNotesShareInfo'
    > = async ({ event, previousState }) => {
        this.updateBulkNotesShareInfoFromShareState({
            previousState,
            shareStates: event.shareStates,
        })
    }

    removePageFromList: EventHandler<'removePageFromList'> = async ({
        event,
        previousState: {
            listsSidebar: { selectedListId: listId },
            searchResults: { results, pageData },
        },
    }) => {
        if (listId == null) {
            throw new Error('No list is currently filtered to remove page from')
        }
        const filterOutPage = (ids: string[]) =>
            ids.filter((id) => id !== event.pageId)

        const mutation: UIMutation<State['searchResults']> = {
            pageData: {
                byId: { $unset: [event.pageId] },
                allIds: { $set: filterOutPage(pageData.allIds) },
            },
        }

        if (event.day === PAGE_SEARCH_DUMMY_DAY) {
            mutation.results = {
                [PAGE_SEARCH_DUMMY_DAY]: {
                    pages: {
                        byId: { $unset: [event.pageId] },
                        allIds: {
                            $set: filterOutPage(
                                results[PAGE_SEARCH_DUMMY_DAY].pages.allIds,
                            ),
                        },
                    },
                },
            }
        } else {
            mutation.results = removeAllResultOccurrencesOfPage(
                results,
                event.pageId,
            )
        }

        await this.options.listsBG.removePageFromList({
            id: listId,
            url: event.pageId,
        })
        this.emitMutation({
            searchResults: mutation,
            listsSidebar:
                listId === SPECIAL_LIST_IDS.INBOX
                    ? {
                          inboxUnreadCount: { $apply: (count) => count - 1 },
                      }
                    : {},
        })
    }

    cancelPageDelete: EventHandler<'cancelPageDelete'> = async ({}) => {
        this.emitMutation({
            modals: { deletingPageArgs: { $set: undefined } },
        })
    }

    confirmPageDelete: EventHandler<'confirmPageDelete'> = async ({
        previousState: {
            searchResults: { pageData, results },
            modals,
        },
    }) => {
        if (!modals.deletingPageArgs) {
            throw new Error('No page ID is set for deletion')
        }

        const { pageId, day } = modals.deletingPageArgs

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { pageDeleteState: { $set: taskState } },
            }),
            async () => {
                const resultsMutation: UIMutation<State['searchResults']> = {
                    pageData: {
                        byId: { $unset: [pageId] },
                        allIds: {
                            $set: pageData.allIds.filter((id) => id !== pageId),
                        },
                    },
                }

                if (day === PAGE_SEARCH_DUMMY_DAY) {
                    resultsMutation.results = {
                        [day]: {
                            pages: {
                                byId: { $unset: [pageId] },
                                allIds: {
                                    $set: results[day].pages.allIds.filter(
                                        (id) => id !== pageId,
                                    ),
                                },
                            },
                        },
                    }
                } else {
                    resultsMutation.results = removeAllResultOccurrencesOfPage(
                        results,
                        pageId,
                    )
                }

                await this.options.searchBG.delPages([pageId])

                this.emitMutation({
                    searchResults: resultsMutation,
                    modals: {
                        deletingPageArgs: { $set: undefined },
                    },
                })
            },
        )
    }

    setPageCopyPasterShown: EventHandler<'setPageCopyPasterShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    isCopyPasterShown: { $set: event.isShown },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageListPickerShown: EventHandler<'setPageListPickerShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    isListPickerShown: { $set: event.isShown },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageTagPickerShown: EventHandler<'setPageTagPickerShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    isTagPickerShown: { $set: event.isShown },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageShareMenuShown: EventHandler<'setPageShareMenuShown'> = async ({
        event,
    }) => {
        if (!(await this.ensureLoggedIn())) {
            return
        }

        if (event.isShown) {
            await this.showShareOnboardingIfNeeded()
        }

        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    isShareMenuShown: { $set: event.isShown },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNotesShown: EventHandler<'setPageNotesShown'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                shouldFormsAutoFocus: { $set: event.areShown },
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    areNotesShown: { $set: event.areShown },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNotesSort: EventHandler<'setPageNotesSort'> = ({
        event,
        previousState,
    }) => {
        const { searchResults } = previousState
        const page = searchResults.results[event.day].pages.byId[event.pageId]

        const sortedNoteIds = page.noteIds[page.notesType].sort((a, b) =>
            event.sortingFn(
                searchResults.noteData.byId[a],
                searchResults.noteData.byId[b],
            ),
        )

        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    noteIds: {
                                        [page.notesType]: {
                                            $set: sortedNoteIds,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNotesType: EventHandler<'setPageNotesType'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    notesType: { $set: event.noteType },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageHover: EventHandler<'setPageHover'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    hoverState: { $set: event.hover },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNewNoteTagPickerShown: EventHandler<
        'setPageNewNoteTagPickerShown'
    > = ({ event }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    newNoteForm: {
                                        isTagPickerShown: {
                                            $set: event.isShown,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNewNoteTags: EventHandler<'setPageNewNoteTags'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    newNoteForm: { tags: { $set: event.tags } },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNewNoteLists: EventHandler<'setPageNewNoteLists'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    newNoteForm: {
                                        lists: { $set: event.lists },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setPageNewNoteCommentValue: EventHandler<'setPageNewNoteCommentValue'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    newNoteForm: {
                                        inputValue: { $set: event.value },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    cancelPageNewNote: EventHandler<'cancelPageNewNote'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    newNoteForm: {
                                        $set: utils.getInitialFormState(),
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    savePageNewNote: EventHandler<'savePageNewNote'> = async ({
        event,
        previousState,
    }) => {
        const { annotationsBG, contentShareBG } = this.options
        const pageData = previousState.searchResults.pageData.byId[event.pageId]
        const formState =
            previousState.searchResults.results[event.day].pages.byId[
                event.pageId
            ].newNoteForm

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { newNoteCreateState: { $set: taskState } },
            }),
            async () => {
                if (event.shouldShare && !(await this.ensureLoggedIn())) {
                    return
                }

                const { savePromise } = await createAnnotation({
                    annotationData: {
                        fullPageUrl: event.fullPageUrl,
                        comment: formState.inputValue,
                    },
                    shareOpts: {
                        shouldShare: event.shouldShare,
                        isBulkShareProtected: event.isProtected,
                        shouldCopyShareLink: event.shouldShare,
                    },
                    annotationsBG,
                    contentSharingBG: contentShareBG,
                    skipPageIndexing: true,
                })

                const newNoteId = await savePromise

                if (formState.tags.length) {
                    await annotationsBG.updateAnnotationTags({
                        url: newNoteId,
                        tags: formState.tags,
                    })
                }
                const newNoteListIds: number[] = []
                if (formState.lists.length) {
                    await contentShareBG.shareAnnotationToSomeLists({
                        annotationUrl: newNoteId,
                        localListIds: formState.lists,
                    })
                    newNoteListIds.push(...formState.lists)
                }

                this.emitMutation({
                    searchResults: {
                        noteData: {
                            allIds: { $push: [newNoteId] },
                            byId: {
                                $apply: (byId) => ({
                                    ...byId,
                                    [newNoteId]: {
                                        url: newNoteId,
                                        displayTime: Date.now(),
                                        comment: formState.inputValue,
                                        tags: formState.tags,
                                        lists: newNoteListIds,
                                        pageUrl: event.pageId,
                                        isShared: event.shouldShare,
                                        isBulkShareProtected: !!event.isProtected,
                                        ...utils.getInitialNoteResultState(
                                            formState.inputValue,
                                        ),
                                    },
                                }),
                            },
                        },
                        results: {
                            [event.day]: {
                                pages: {
                                    byId: {
                                        [event.pageId]: {
                                            newNoteForm: {
                                                $set: utils.getInitialFormState(),
                                            },
                                            noteIds: {
                                                user: { $push: [newNoteId] },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                })
            },
        )
    }

    setPageData: EventHandler<'setPageData'> = ({ event: { pages } }) => {
        const allIds = pages.map((page) => page.normalizedUrl)
        const byId = pages.reduce(
            (acc, curr) => ({ ...acc, [curr.normalizedUrl]: curr }),
            {},
        )

        this.emitMutation({
            searchResults: {
                pageData: { allIds: { $set: allIds }, byId: { $set: byId } },
            },
        })
    }

    setSearchType: EventHandler<'setSearchType'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchResults: {
                shouldFormsAutoFocus: { $set: false },
                searchType: { $set: event.searchType },
            },
        })
    }

    setAllNotesShown: EventHandler<'setAllNotesShown'> = ({
        previousState,
    }) => {
        const applyChangeTooAll = (newState: boolean) => (
            results: State['searchResults']['results'],
        ) => {
            for (const { day, pages } of Object.values(
                previousState.searchResults.results,
            )) {
                const pageIdsWithNotes = pages.allIds.filter((pageId) => {
                    const page = results[day].pages.byId[pageId]
                    return page.noteIds[page.notesType].length > 0
                })

                for (const pageId of pageIdsWithNotes) {
                    results[day].pages.byId[pageId].areNotesShown = newState
                }
            }
            return results
        }

        if (utils.areAllNotesShown(previousState.searchResults)) {
            this.emitMutation({
                searchResults: {
                    results: {
                        $apply: applyChangeTooAll(false),
                    },
                },
            })
        } else {
            this.emitMutation({
                searchResults: {
                    results: {
                        $apply: applyChangeTooAll(true),
                    },
                },
            })
        }
    }

    setSearchCopyPasterShown: EventHandler<'setSearchCopyPasterShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: { isSearchCopyPasterShown: { $set: event.isShown } },
        })
    }

    closeCloudOnboardingModal: EventHandler<'closeCloudOnboardingModal'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                isCloudUpgradeBannerShown: { $set: !event.didFinish },
            },
            modals: {
                showCloudOnboarding: { $set: false },
            },
            isCloudEnabled: { $set: event.didFinish },
        })
    }

    setListShareMenuShown: EventHandler<'setListShareMenuShown'> = async ({
        event,
    }) => {
        if (!(await this.ensureLoggedIn())) {
            return
        }

        this.emitMutation({
            searchResults: { isListShareMenuShown: { $set: event.isShown } },
        })
    }

    setSortMenuShown: EventHandler<'setSortMenuShown'> = async ({ event }) => {
        this.emitMutation({
            searchResults: { isSortMenuShown: { $set: event.isShown } },
        })
    }

    setDeletingNoteArgs: EventHandler<'setDeletingNoteArgs'> = async ({
        event,
    }) => {
        this.emitMutation({
            modals: { deletingNoteArgs: { $set: event } },
        })
    }

    cancelNoteDelete: EventHandler<'cancelNoteDelete'> = async ({}) => {
        this.emitMutation({
            modals: { deletingNoteArgs: { $set: undefined } },
        })
    }

    confirmNoteDelete: EventHandler<'confirmNoteDelete'> = async ({
        previousState: { modals, searchResults },
    }) => {
        if (!modals.deletingNoteArgs) {
            throw new Error('No note ID is set for deletion')
        }

        const { noteId, pageId, day } = modals.deletingNoteArgs
        const pageResult = searchResults.results[day].pages.byId[pageId]
        const pageResultNoteIds = pageResult.noteIds[
            pageResult.notesType
        ].filter((id) => id !== noteId)
        const notesAllIds = searchResults.noteData.allIds.filter(
            (id) => id !== noteId,
        )

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { noteDeleteState: { $set: taskState } },
            }),
            async () => {
                await this.options.annotationsBG.deleteAnnotation(noteId)

                this.emitMutation({
                    modals: {
                        deletingNoteArgs: { $set: undefined },
                    },
                    searchResults: {
                        results: {
                            [day]: {
                                pages: {
                                    byId: {
                                        [pageId]: {
                                            noteIds: {
                                                [pageResult.notesType]: {
                                                    $set: pageResultNoteIds,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        noteData: {
                            allIds: { $set: notesAllIds },
                            byId: { $unset: [noteId] },
                        },
                    },
                })
            },
        )
    }

    setNoteEditing: EventHandler<'setNoteEditing'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isEditing: { $set: event.isEditing },
                        },
                    },
                },
            },
        })
    }

    setNoteTagPickerShown: EventHandler<'setNoteTagPickerShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isTagPickerShown: { $set: event.isShown },
                        },
                    },
                },
            },
        })
    }
    setNoteListPickerShown: EventHandler<'setNoteListPickerShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isListPickerShown: { $set: event.isShown },
                        },
                    },
                },
            },
        })
    }

    setNoteCopyPasterShown: EventHandler<'setNoteCopyPasterShown'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isCopyPasterShown: { $set: event.isShown },
                        },
                    },
                },
            },
        })
    }

    setNoteRepliesShown: EventHandler<'setNoteRepliesShown'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            areRepliesShown: { $set: event.areShown },
                        },
                    },
                },
            },
        })
    }

    setNoteTags: EventHandler<'setNoteTags'> = async ({ event }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            tags: { $apply: updatePickerValues(event) },
                        },
                    },
                },
            },
        })

        await this.options.annotationsBG.editAnnotationTags({
            url: event.noteId,
            tagsToBeAdded: event.added ? [event.added] : [],
            tagsToBeDeleted: event.deleted ? [event.deleted] : [],
        })
    }

    setNoteLists: EventHandler<'setNoteLists'> = async ({
        event,
        previousState,
    }) => {
        const { contentShareBG } = this.options
        const noteData = previousState.searchResults.noteData.byId[event.noteId]
        const pageData =
            previousState.searchResults.pageData.byId[noteData.pageUrl]
        const isSharedList =
            previousState.listsSidebar.listData[event.added ?? event.deleted]
                ?.remoteId != null

        let remoteFn: () => Promise<any>

        const noteListIds = new Set(noteData.lists)
        const pageListIds = new Set(pageData.lists)

        if (event.added != null) {
            remoteFn = () =>
                contentShareBG.shareAnnotationToSomeLists({
                    annotationUrl: event.noteId,
                    localListIds: [event.added],
                    protectAnnotation: event.protectAnnotation,
                })
            noteListIds.add(event.added)
            pageListIds.add(event.added)
        } else if (event.deleted != null) {
            remoteFn = () =>
                contentShareBG.unshareAnnotationFromList({
                    annotationUrl: event.noteId,
                    localListId: event.deleted,
                })
            noteListIds.delete(event.deleted)
            pageListIds.delete(event.deleted)
        } else {
            return
        }

        const isSharedListBeingRemovedFromSharedAnnot =
            isSharedList && noteData.isShared && event.added == null

        const searchResultsMutation: UIMutation<State['searchResults']> = {
            noteData: {
                byId: {
                    [event.noteId]: {
                        lists: {
                            $set:
                                event.protectAnnotation ||
                                isSharedListBeingRemovedFromSharedAnnot
                                    ? [
                                          ...new Set([
                                              ...pageListIds,
                                              ...noteListIds,
                                          ]),
                                      ]
                                    : [...noteListIds],
                        },
                        isShared: {
                            $set:
                                event.protectAnnotation ??
                                isSharedListBeingRemovedFromSharedAnnot
                                    ? false
                                    : noteData.isShared,
                        },
                        isBulkShareProtected: {
                            $set:
                                event.protectAnnotation ??
                                ((!noteData.isShared && isSharedList) || // If annot not shared (but list is), it needs to be protected upon list add/remove
                                isSharedListBeingRemovedFromSharedAnnot
                                    ? true
                                    : noteData.isBulkShareProtected),
                        },
                    },
                },
            },
        }

        if (isSharedList && event.deleted == null) {
            const otherNoteIds = flattenNestedResults(previousState).byId[
                noteData.pageUrl
            ].noteIds.user
            const publicNoteIds = otherNoteIds.filter(
                (noteId) =>
                    previousState.searchResults.noteData.byId[noteId]
                        .isShared && noteId !== event.noteId,
            )

            for (const noteId of publicNoteIds) {
                const listIds = new Set(
                    previousState.searchResults.noteData.byId[noteId].lists,
                )

                if (event.added != null) {
                    listIds.add(event.added)
                } else if (event.deleted != null) {
                    listIds.delete(event.deleted)
                }

                ;(searchResultsMutation.noteData as any).byId[noteId] = {
                    ...(searchResultsMutation.noteData as any).byId[noteId],
                    lists: { $set: [...listIds] },
                }
            }

            searchResultsMutation.pageData = {
                byId: {
                    [noteData.pageUrl]: {
                        lists: { $set: [...pageListIds] },
                    },
                },
            }
        }

        if (remoteFn) {
            this.emitMutation({
                searchResults: searchResultsMutation,
                modals: { confirmSelectNoteSpaceArgs: { $set: null } },
            })
            await remoteFn()
        }
    }

    private getAnnotListsAfterShareStateChange(params: {
        previousState: State
        noteId: string
        incomingPrivacyState: AnnotationPrivacyState
        keepListsIfUnsharing?: boolean
    }) {
        const existing =
            params.previousState.searchResults.noteData.byId[params.noteId]
        const pageData =
            params.previousState.searchResults.pageData.byId[existing.pageUrl]

        const hasSharedLists = existing.lists.some(
            (listId) =>
                params.previousState.listsSidebar.listData[listId]?.remoteId !=
                null,
        )
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
                (listId) =>
                    params.previousState.listsSidebar.listData[listId]
                        ?.remoteId == null,
            )
        } else if (willUnshare && params.keepListsIfUnsharing) {
            return [...new Set([...pageData.lists, ...existing.lists])]
        }

        return existing.lists
    }

    updateNoteShareInfo: EventHandler<'updateNoteShareInfo'> = async ({
        event,
        previousState,
    }) => {
        const privacyState = getAnnotationPrivacyState(event.privacyLevel)

        const lists = this.getAnnotListsAfterShareStateChange({
            previousState,
            noteId: event.noteId,
            incomingPrivacyState: privacyState,
            keepListsIfUnsharing: event.keepListsIfUnsharing,
        })

        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isShared: { $set: privacyState.public },
                            isBulkShareProtected: {
                                $set:
                                    privacyState.protected ||
                                    !!event.keepListsIfUnsharing,
                            },
                            lists: { $set: lists },
                        },
                    },
                },
            },
        })
    }

    goToHighlightInNewTab: EventHandler<'goToHighlightInNewTab'> = async ({
        event,
        previousState,
    }) => {
        const note = previousState.searchResults.noteData.byId[event.noteId]
        await this.options.annotationsBG.goToAnnotationFromSidebar({
            url: note.pageUrl,
            annotation: note,
        })
    }

    copyShareLink: EventHandler<'copyShareLink'> = async ({ event }) => {
        await Promise.all([
            this.options.copyToClipboard(event.link),
            this.options.analytics.trackEvent({
                category: 'ContentSharing',
                action: event.analyticsAction,
            }),
        ])
    }

    dismissSubscriptionBanner: EventHandler<
        'dismissSubscriptionBanner'
    > = async () => {
        await this.syncSettings.dashboard.set('subscribeBannerShownAfter', null)
        this.emitMutation({
            searchResults: { isSubscriptionBannerShown: { $set: false } },
        })
    }

    dismissMobileAd: EventHandler<'dismissMobileAd'> = async () => {
        await this.options.localStorage.set({
            [STORAGE_KEYS.mobileAdSeen]: true,
        })
        this.emitMutation({
            searchResults: { showMobileAppAd: { $set: false } },
        })
    }

    dismissOnboardingMsg: EventHandler<'dismissOnboardingMsg'> = async () => {
        await this.syncSettings.dashboard.set('onboardingMsgSeen', true)
        this.emitMutation({
            searchResults: { showOnboardingMsg: { $set: false } },
        })
    }

    setNoteShareMenuShown: EventHandler<'setNoteShareMenuShown'> = async ({
        event,
    }) => {
        if (!(await this.ensureLoggedIn())) {
            return
        }

        if (event.shouldShow) {
            await this.showShareOnboardingIfNeeded()
        }

        const immediateShare =
            (event.platform === 'MacIntel'
                ? event.mouseEvent.metaKey
                : event.mouseEvent.ctrlKey) && event.mouseEvent.altKey

        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            shareMenuShowStatus: {
                                $set: event.shouldShow
                                    ? immediateShare
                                        ? 'show-n-share'
                                        : 'show'
                                    : 'hide',
                            },
                        },
                    },
                },
            },
            modals: {
                confirmPrivatizeNoteArgs: { $set: null },
                confirmSelectNoteSpaceArgs: { $set: null },
            },
        })
    }

    private async showShareOnboardingIfNeeded(now = Date.now()) {
        // const lastShared = await this.syncSettings.contentSharing.get(
        //     'lastSharedAnnotationTimestamp',
        // )

        // if (lastShared == null) {
        //     this.emitMutation({
        //         modals: { showNoteShareOnboarding: { $set: true } },
        //     })
        // }

        await this.syncSettings.contentSharing.set(
            'lastSharedAnnotationTimestamp',
            now,
        )
    }

    setNoteEditCommentValue: EventHandler<'setNoteEditCommentValue'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            editNoteForm: {
                                inputValue: { $set: event.value },
                            },
                        },
                    },
                },
            },
        })
    }

    cancelNoteEdit: EventHandler<'cancelNoteEdit'> = ({
        event,
        previousState,
    }) => {
        const {
            comment,
            tags,
            lists,
        } = previousState.searchResults.noteData.byId[event.noteId]

        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isEditing: { $set: false },
                            editNoteForm: {
                                isTagPickerShown: { $set: false },
                                isListPickerShown: { $set: false },
                                inputValue: { $set: comment ?? '' },
                                tags: { $set: tags ?? [] },
                                lists: { $set: lists ?? [] },
                            },
                        },
                    },
                },
            },
        })
    }

    saveNoteEdit: EventHandler<'saveNoteEdit'> = async ({
        event,
        previousState,
    }) => {
        const {
            editNoteForm,
            ...existing
        } = previousState.searchResults.noteData.byId[event.noteId]
        const tagsHaveChanged = haveArraysChanged(
            existing.tags,
            editNoteForm.tags,
        )

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { noteUpdateState: { $set: taskState } },
            }),
            async () => {
                if (event.shouldShare && !(await this.ensureLoggedIn())) {
                    return
                }

                // If the main save button was pressed, then we're not changing any share state, thus keep the old lists
                // NOTE: this distinction exists because of the SAS state being implicit and the logic otherwise thinking you want
                //  to make a SAS annotation private protected upon save btn press
                const lists = event.mainBtnPressed
                    ? previousState.searchResults.noteData.byId[event.noteId]
                          ?.lists ?? []
                    : this.getAnnotListsAfterShareStateChange({
                          previousState,
                          noteId: event.noteId,
                          keepListsIfUnsharing: event.keepListsIfUnsharing,
                          incomingPrivacyState: {
                              public: event.shouldShare,
                              protected: !!event.isProtected,
                          },
                      })

                this.emitMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [event.noteId]: {
                                    isEditing: { $set: false },
                                    tags: { $set: editNoteForm.tags },
                                    isShared: { $set: event.shouldShare },
                                    comment: { $set: editNoteForm.inputValue },
                                    isBulkShareProtected: {
                                        $set:
                                            event.isProtected ||
                                            !!event.keepListsIfUnsharing,
                                    },
                                    lists: { $set: lists },
                                },
                            },
                        },
                    },
                    modals: {
                        confirmPrivatizeNoteArgs: { $set: null },
                    },
                })

                await updateAnnotation({
                    annotationData: {
                        localId: event.noteId,
                        comment: editNoteForm.inputValue,
                    },
                    shareOpts: {
                        shouldShare: event.shouldShare,
                        shouldCopyShareLink: event.shouldShare,
                        isBulkShareProtected: event.isProtected,
                        skipPrivacyLevelUpdate: event.mainBtnPressed,
                    },
                    annotationsBG: this.options.annotationsBG,
                    contentSharingBG: this.options.contentShareBG,
                    keepListsIfUnsharing: event.keepListsIfUnsharing,
                })

                if (tagsHaveChanged) {
                    await this.options.annotationsBG.updateAnnotationTags({
                        url: event.noteId,
                        tags: editNoteForm.tags,
                    })
                }
            },
        )
    }
    /* END - search result event handlers */

    /* START - search filter event handlers */
    setSearchQuery: EventHandler<'setSearchQuery'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { searchQuery: { $set: event.query } },
        })
    }

    setSearchFiltersOpen: EventHandler<'setSearchFiltersOpen'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            searchFilters: { searchFiltersOpen: { $set: event.isOpen } },
        })

        if (!event.isOpen) {
            await this.processUIEvent('resetFilters', {
                event: null,
                previousState,
            })
        }
    }

    toggleShowTagPicker: EventHandler<'toggleShowTagPicker'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: {
                isTagFilterActive: { $set: event.isActive },
                isDomainFilterActive: { $set: false },
                isSpaceFilterActive: { $set: false },
                isDateFilterActive: { $set: false },
            },
        })
    }

    toggleShowSpacePicker: EventHandler<'toggleShowSpacePicker'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: {
                isSpaceFilterActive: { $set: event.isActive },
                isDomainFilterActive: { $set: false },
                isDateFilterActive: { $set: false },
                isTagFilterActive: { $set: false },
            },
        })
    }

    toggleShowDatePicker: EventHandler<'toggleShowDatePicker'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: {
                isDateFilterActive: { $set: event.isActive },
                isDomainFilterActive: { $set: false },
                isSpaceFilterActive: { $set: false },
                isTagFilterActive: { $set: false },
            },
        })
    }

    toggleShowDomainPicker: EventHandler<'toggleShowDomainPicker'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: {
                isDomainFilterActive: { $set: event.isActive },
                isSpaceFilterActive: { $set: false },
                isDateFilterActive: { $set: false },
                isTagFilterActive: { $set: false },
            },
        })
    }

    setDateFromInputValue: EventHandler<'setDateFromInputValue'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { dateFromInput: { $set: event.value } },
        })
    }

    setDateToInputValue: EventHandler<'setDateToInputValue'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: { dateToInput: { $set: event.value } },
        })
    }

    setDateFrom: EventHandler<'setDateFrom'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { dateFrom: { $set: event.value } },
        })
    }

    setDateTo: EventHandler<'setDateTo'> = async ({ event, previousState }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { dateTo: { $set: event.value } },
        })
    }

    setSpacesIncluded: EventHandler<'setSpacesIncluded'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: {
                spacesIncluded: { $set: event.spaceIds },
                searchFiltersOpen: { $set: true },
            },
        })
    }

    addIncludedSpace: EventHandler<'addIncludedSpace'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: {
                spacesIncluded: { $push: [event.spaceId] },
                searchFiltersOpen: { $set: true },
            },
        })
    }

    delIncludedSpace: EventHandler<'delIncludedSpace'> = async ({
        event,
        previousState,
    }) => {
        const index = previousState.searchFilters.spacesIncluded.findIndex(
            (spaceId) => spaceId === event.spaceId,
        )

        if (index === -1) {
            return
        }

        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: {
                spacesIncluded: { $splice: [[index, 1]] },
                searchFiltersOpen: { $set: true },
            },
        })
    }

    addIncludedTag: EventHandler<'addIncludedTag'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: {
                tagsIncluded: { $push: [event.tag] },
                searchFiltersOpen: { $set: true },
            },
        })
    }

    delIncludedTag: EventHandler<'delIncludedTag'> = async ({
        event,
        previousState,
    }) => {
        const index = previousState.searchFilters.tagsIncluded.findIndex(
            (tag) => tag === event.tag,
        )

        if (index === -1) {
            return
        }

        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { tagsIncluded: { $splice: [[index, 1]] } },
        })
    }

    addExcludedTag: EventHandler<'addExcludedTag'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { tagsExcluded: { $push: [event.tag] } },
        })
    }

    delExcludedTag: EventHandler<'delExcludedTag'> = async ({
        event,
        previousState,
    }) => {
        const index = previousState.searchFilters.tagsExcluded.findIndex(
            (tag) => tag === event.tag,
        )

        if (index === -1) {
            return
        }

        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { tagsExcluded: { $splice: [[index, 1]] } },
        })
    }

    addIncludedDomain: EventHandler<'addIncludedDomain'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { domainsIncluded: { $push: [event.domain] } },
        })
    }

    delIncludedDomain: EventHandler<'delIncludedDomain'> = async ({
        event,
        previousState,
    }) => {
        const index = previousState.searchFilters.domainsIncluded.findIndex(
            (tag) => tag === event.domain,
        )

        if (index === -1) {
            return
        }

        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { domainsIncluded: { $splice: [[index, 1]] } },
        })
    }

    addExcludedDomain: EventHandler<'addExcludedDomain'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { domainsExcluded: { $push: [event.domain] } },
        })
    }

    delExcludedDomain: EventHandler<'delExcludedDomain'> = async ({
        event,
        previousState,
    }) => {
        const index = previousState.searchFilters.domainsExcluded.findIndex(
            (tag) => tag === event.domain,
        )

        if (index === -1) {
            return
        }

        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { domainsExcluded: { $splice: [[index, 1]] } },
        })
    }

    setTagsIncluded: EventHandler<'setTagsIncluded'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { tagsIncluded: { $set: event.tags } },
        })
    }

    setTagsExcluded: EventHandler<'setTagsExcluded'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { tagsExcluded: { $set: event.tags } },
        })
    }

    setDomainsIncluded: EventHandler<'setDomainsIncluded'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { domainsIncluded: { $set: event.domains } },
        })
    }

    setDomainsExcluded: EventHandler<'setDomainsExcluded'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { domainsExcluded: { $set: event.domains } },
        })
    }

    resetFilters: EventHandler<'resetFilters'> = async ({
        event,
        previousState,
    }) => {
        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { $set: this.getInitialState().searchFilters },
            listsSidebar: { selectedListId: { $set: undefined } },
        })
    }
    /* END - search filter event handlers */

    /* START - lists sidebar event handlers */
    setSidebarLocked: EventHandler<'setSidebarLocked'> = async ({ event }) => {
        this.emitMutation({
            listsSidebar: {
                isSidebarLocked: { $set: event.isLocked },
                isSidebarPeeking: { $set: !event.isLocked },
            },
        })

        await this.syncSettings.dashboard.set(
            'listSidebarLocked',
            event.isLocked,
        )
    }

    setSidebarPeeking: EventHandler<'setSidebarPeeking'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: { isSidebarPeeking: { $set: event.isPeeking } },
        })
    }

    setSidebarToggleHovered: EventHandler<'setSidebarToggleHovered'> = async ({
        previousState: { listsSidebar },
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                isSidebarToggleHovered: { $set: event.isHovered },
                isSidebarPeeking: {
                    $set: !listsSidebar.isSidebarLocked && event.isHovered,
                },
            },
        })
    }

    setListQueryValue: EventHandler<'setListQueryValue'> = async ({
        event,
        previousState,
    }) => {
        const filteredListIds = filterListsByQuery(
            event.query,
            previousState.listsSidebar,
        )

        this.emitMutation({
            listsSidebar: {
                searchQuery: { $set: event.query },
                localLists: {
                    filteredListIds: { $set: filteredListIds.localListIds },
                },
                followedLists: {
                    filteredListIds: { $set: filteredListIds.followedListIds },
                },
            },
        })
    }

    setAddListInputShown: EventHandler<'setAddListInputShown'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                localLists: { isAddInputShown: { $set: event.isShown } },
            },
        })
    }

    cancelListCreate: EventHandler<'cancelListCreate'> = async ({ event }) => {
        this.emitMutation({
            listsSidebar: {
                addListErrorMessage: { $set: null },
                localLists: {
                    isAddInputShown: { $set: false },
                },
            },
        })
    }

    confirmListCreate: EventHandler<'confirmListCreate'> = async ({
        event,
        previousState,
    }) => {
        const newListName = event.value.trim()
        const validationResult = validateSpaceName(
            newListName,
            previousState.listsSidebar.localLists.allListIds.reduce(
                (acc, listId) => [
                    ...acc,
                    previousState.listsSidebar.listData[listId],
                ],
                [],
            ),
        )

        if (validationResult.valid === false) {
            this.emitMutation({
                listsSidebar: {
                    addListErrorMessage: {
                        $set: validationResult.reason,
                    },
                },
            })
            return
        }

        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: { listCreateState: { $set: taskState } },
            }),
            async () => {
                const listId = await this.options.listsBG.createCustomList({
                    name: newListName,
                })

                this.emitMutation({
                    listsSidebar: {
                        localLists: {
                            isAddInputShown: { $set: false },
                            filteredListIds: { $push: [listId] },
                            allListIds: { $push: [listId] },
                        },
                        listData: {
                            [listId]: {
                                $set: {
                                    id: listId,
                                    name: newListName,
                                    isOwnedList: true,
                                },
                            },
                        },
                        addListErrorMessage: {
                            $set: null,
                        },
                    },
                })
            },
        )
    }

    setLocalListsExpanded: EventHandler<'setLocalListsExpanded'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                localLists: { isExpanded: { $set: event.isExpanded } },
            },
        })
    }

    setFollowedListsExpanded: EventHandler<
        'setFollowedListsExpanded'
    > = async ({ event }) => {
        this.emitMutation({
            listsSidebar: {
                followedLists: { isExpanded: { $set: event.isExpanded } },
            },
        })
    }

    setSelectedListId: EventHandler<'setSelectedListId'> = async ({
        event,
        previousState,
    }) => {
        const listIdToSet =
            previousState.listsSidebar.selectedListId === event.listId
                ? undefined
                : event.listId

        await this.mutateAndTriggerSearch(previousState, {
            listsSidebar: { selectedListId: { $set: listIdToSet } },
        })
    }

    setDragOverListId: EventHandler<'setDragOverListId'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: { dragOverListId: { $set: event.listId } },
        })
    }

    dropPageOnListItem: EventHandler<'dropPageOnListItem'> = async ({
        event,
    }) => {
        const { fullPageUrl, normalizedPageUrl } = JSON.parse(
            event.dataTransfer.getData('text/plain'),
        ) as { fullPageUrl: string; normalizedPageUrl: string }

        if (!fullPageUrl || !normalizedPageUrl) {
            return
        }

        this.options.analytics.trackEvent({
            category: 'Collections',
            action: 'addPageViaDragAndDrop',
        })

        await this.options.listsBG.insertPageToList({
            id: event.listId,
            url: fullPageUrl,
            skipPageIndexing: true,
        })

        this.emitMutation({
            listsSidebar: {
                dragOverListId: { $set: undefined },
                listData: {
                    [event.listId]: {
                        wasPageDropped: { $set: true },
                    },
                },
            },
            searchResults: {
                pageData: {
                    byId: {
                        [normalizedPageUrl]: {
                            lists: {
                                $apply: (lists: number[]) =>
                                    lists.includes(event.listId)
                                        ? lists
                                        : [...lists, event.listId],
                            },
                        },
                    },
                },
            },
        })

        setTimeout(
            () =>
                this.emitMutation({
                    listsSidebar: {
                        listData: {
                            [event.listId]: {
                                wasPageDropped: { $set: false },
                            },
                        },
                    },
                }),
            2000,
        )
    }

    setListRemoteId: EventHandler<'setListRemoteId'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            listsSidebar: {
                listData: {
                    [event.localListId]: {
                        remoteId: { $set: event.remoteListId },
                    },
                },
            },
        })
    }

    shareList: EventHandler<'shareList'> = async ({ event, previousState }) => {
        const { remoteListId } = await this.options.contentShareBG.shareList({
            listId: event.listId,
        })

        const memberAnnotParentPageIds = new Set<string>()
        const memberPrivateAnnotIds = new Set<string>()
        for (const noteData of Object.values(
            previousState.searchResults.noteData.byId,
        )) {
            if (noteData.lists.includes(event.listId)) {
                memberAnnotParentPageIds.add(noteData.pageUrl)

                if (!noteData.isShared && !noteData.isBulkShareProtected) {
                    memberPrivateAnnotIds.add(noteData.url)
                }
            }
        }

        const mutation: UIMutation<State['searchResults']> = {
            pageData: { byId: {} },
            noteData: { byId: {} },
        }

        for (const pageId of memberAnnotParentPageIds) {
            mutation.pageData = {
                ...mutation.pageData,
                byId: {
                    ...(mutation.pageData as any).byId,
                    [pageId]: { lists: { $push: [event.listId] } },
                },
            }
        }

        for (const noteId of memberPrivateAnnotIds) {
            mutation.noteData = {
                ...mutation.noteData,
                byId: {
                    ...(mutation.noteData as any).byId,
                    [noteId]: { isBulkShareProtected: { $set: true } },
                },
            }
        }

        this.emitMutation({
            searchResults: mutation,
            listsSidebar: {
                listData: {
                    [event.listId]: {
                        remoteId: { $set: remoteListId },
                    },
                },
            },
        })
    }

    changeListName: EventHandler<'changeListName'> = async ({
        event,
        previousState,
    }) => {
        const { editingListId: listId } = previousState.listsSidebar

        if (!listId) {
            throw new Error('No list ID is set for editing')
        }
        const oldName = previousState.listsSidebar.listData[listId]?.name ?? ''
        const newName = event.value.trim()

        if (newName === oldName) {
            return
        }
        const validationResult = validateSpaceName(
            newName,
            previousState.listsSidebar.localLists.allListIds.reduce(
                (acc, listId) => [
                    ...acc,
                    previousState.listsSidebar.listData[listId],
                ],
                [],
            ),
            {
                listIdToSkip: listId,
            },
        )

        if (validationResult.valid === false) {
            this.emitMutation({
                listsSidebar: {
                    editListErrorMessage: {
                        $set: validationResult.reason,
                    },
                },
            })
            return
        }

        this.emitMutation({
            listsSidebar: {
                editListErrorMessage: { $set: null },
                listData: {
                    [listId]: { name: { $set: newName } },
                },
            },
        })
    }

    confirmListEdit: EventHandler<'confirmListEdit'> = async ({
        event,
        previousState,
    }) => {
        // listNameEdit
        const { editingListId: listId } = previousState.listsSidebar

        if (!listId) {
            throw new Error('No list ID is set for editing')
        }

        const { name: oldName } = await this.options.listsBG.fetchListById({
            id: listId,
        })

        const newName = previousState.listsSidebar.listData[listId].name

        if (newName === oldName) {
            this.emitMutation({
                listsSidebar: {
                    editingListId: { $set: undefined },
                },
            })
            return
        }

        const validationResult = validateSpaceName(
            newName,
            previousState.listsSidebar.localLists.allListIds.reduce(
                (acc, listId) => [
                    ...acc,
                    previousState.listsSidebar.listData[listId],
                ],
                [],
            ),
            {
                listIdToSkip: listId,
            },
        )

        if (validationResult.valid === false) {
            this.emitMutation({
                listsSidebar: {
                    editListErrorMessage: {
                        $set: validationResult.reason,
                    },
                },
            })
            return
        }

        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: { listEditState: { $set: taskState } },
            }),
            async () => {
                await this.options.listsBG.updateListName({
                    id: listId,
                    oldName,
                    newName,
                })

                await this.changeListName({
                    event,
                    previousState,
                })

                this.emitMutation({
                    listsSidebar: {
                        editingListId: { $set: undefined },
                        editListErrorMessage: {
                            $set: null,
                        },
                    },
                })
            },
        )
    }

    cancelListEdit: EventHandler<'cancelListEdit'> = async ({
        previousState,
    }) => {
        const { editingListId: listId } = previousState.listsSidebar

        if (!listId) {
            throw new Error('No list ID is set for editing')
        }
        const { name: oldName } = await this.options.listsBG.fetchListById({
            id: listId,
        })

        // reseet name to name in db
        await this.changeListName({
            event: { value: oldName },
            previousState,
        })

        this.emitMutation({
            listsSidebar: {
                editListErrorMessage: { $set: null },
                editingListId: { $set: undefined },
                showMoreMenuListId: { $set: undefined },
            },
        })
    }

    setEditingListId: EventHandler<'setEditingListId'> = async ({
        event,
        previousState,
    }) => {
        if (previousState.listsSidebar.editingListId !== event.listId) {
            this.emitMutation({
                listsSidebar: {
                    editingListId: { $set: event.listId },
                },
            })
        }
    }

    setShowMoreMenuListId: EventHandler<'setShowMoreMenuListId'> = async ({
        event,
        previousState,
    }) => {
        const listIdToSet =
            previousState.listsSidebar.showMoreMenuListId === event.listId
                ? undefined
                : event.listId

        this.emitMutation({
            listsSidebar: {
                showMoreMenuListId: { $set: listIdToSet },
                editingListId: { $set: listIdToSet },
            },
        })
    }

    setLocalLists: EventHandler<'setLocalLists'> = async ({ event }) => {
        const listIds: number[] = []
        const listDataById = {}

        for (const list of event.lists) {
            listIds.push(list.id)
            listDataById[list.id] = list
        }

        this.emitMutation({
            listsSidebar: {
                listData: { $merge: listDataById },
                localLists: {
                    filteredListIds: { $set: listIds },
                    allListIds: { $set: listIds },
                },
            },
        })
    }

    setFollowedLists: EventHandler<'setFollowedLists'> = async ({ event }) => {
        const listIds: number[] = []
        const listDataById = {}

        for (const list of event.lists) {
            listIds.push(list.id)
            listDataById[list.id] = list
        }

        this.emitMutation({
            listsSidebar: {
                listData: { $merge: listDataById },
                followedLists: {
                    filteredListIds: { $set: listIds },
                    allListIds: { $set: listIds },
                },
            },
        })
    }

    setDeletingListId: EventHandler<'setDeletingListId'> = async ({
        event,
    }) => {
        this.emitMutation({
            modals: {
                deletingListId: { $set: event.listId },
            },
            listsSidebar: {
                showMoreMenuListId: { $set: undefined },
            },
        })
    }

    cancelListDelete: EventHandler<'cancelListDelete'> = async ({ event }) => {
        this.emitMutation({
            modals: {
                deletingListId: { $set: undefined },
            },
        })
    }

    confirmListDelete: EventHandler<'confirmListDelete'> = async ({
        event,
        previousState,
    }) => {
        const listId = previousState.modals.deletingListId
        // TODO: support for non-local lists
        const localListIds = previousState.listsSidebar.localLists.filteredListIds.filter(
            (id) => id !== listId,
        )

        if (!listId) {
            throw new Error('No list ID is set for deletion')
        }

        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: { listDeleteState: { $set: taskState } },
            }),
            async () => {
                await this.options.listsBG.removeList({ id: listId })

                this.emitMutation({
                    modals: {
                        deletingListId: { $set: undefined },
                    },
                    listsSidebar: {
                        localLists: {
                            filteredListIds: { $set: localListIds },
                            allListIds: { $set: localListIds },
                        },
                        listData: { $unset: [listId] },
                        selectedListId: { $set: undefined },
                    },
                })
            },
        )
    }

    clickFeedActivityIndicator: EventHandler<
        'clickFeedActivityIndicator'
    > = async ({ previousState }) => {
        if (!(await this.ensureLoggedIn())) {
            return
        }

        this.options.openFeed()

        if (previousState.listsSidebar.hasFeedActivity) {
            await setLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY, false)
            this.emitMutation({
                listsSidebar: { hasFeedActivity: { $set: false } },
            })
        }
    }
    /* END - lists sidebar event handlers */

    /* START - sync status menu event handlers */
    setSyncStatusMenuDisplayState: EventHandler<
        'setSyncStatusMenuDisplayState'
    > = async ({ event }) => {
        this.emitMutation({
            syncMenu: { isDisplayed: { $set: event.isShown } },
        })
    }

    setPendingChangeCounts: EventHandler<'setPendingChangeCounts'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            syncMenu: {
                pendingLocalChangeCount: {
                    $set:
                        event.local ??
                        previousState.syncMenu.pendingLocalChangeCount,
                },
                pendingRemoteChangeCount: {
                    $set:
                        event.remote ??
                        previousState.syncMenu.pendingRemoteChangeCount,
                },
            },
        })
    }
    /* END - sync status menu event handlers */
}
