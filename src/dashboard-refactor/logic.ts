import { UILogic, UIEventHandler, UIMutation } from 'ui-logic-core'
import debounce from 'lodash/debounce'

import * as utils from './search-results/util'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import { RootState as State, DashboardDependencies, Events } from './types'
import { haveTagsChanged } from 'src/util/have-tags-changed'
import {
    getLastSharedAnnotationTimestamp,
    setLastSharedAnnotationTimestamp,
} from 'src/annotations/utils'
import {
    PAGE_SIZE,
    STORAGE_KEYS,
    PAGE_SEARCH_DUMMY_DAY,
    NON_UNIQ_LIST_NAME_ERR_MSG,
} from 'src/dashboard-refactor/constants'
import { ListData } from './lists-sidebar/types'
import { updatePickerValues, stateToSearchParams } from './util'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-storage/lib/lists/constants'
import { NoResultsType } from './search-results/types'
import { isListNameUnique, filterListsByQuery } from './lists-sidebar/util'
import { DisableableState } from './header/sync-status-menu/types'
import { DRAG_EL_ID } from './components/DragElement'
import { AnnotationPrivacyLevels } from 'src/annotations/types'
import { AnnotationSharingInfo } from 'src/content-sharing/ui/types'
import { mergeNormalizedStates } from 'src/common-ui/utils'

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
    constructor(private options: DashboardDependencies) {
        super()
    }

    getInitialState(): State {
        return {
            modals: {
                showLogin: false,
                showBetaFeature: false,
                showSubscription: false,
                showNoteShareOnboarding: false,
            },
            loadState: 'pristine',
            searchResults: {
                sharingAccess: 'feature-disabled',
                noteSharingInfo: {},
                results: {},
                noResultsType: null,
                showMobileAppAd: false,
                showOnboardingMsg: false,
                areResultsExhausted: false,
                shouldFormsAutoFocus: false,
                isListShareMenuShown: false,
                isSearchCopyPasterShown: false,
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
                isDomainFilterActive: false,
                isTagFilterActive: false,
                searchFiltersOpen: false,
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
                syncState: 'disabled',
                backupState: 'disabled',
                isAutoBackupEnabled: false,
                lastSuccessfulBackupDate: null,
                lastSuccessfulSyncDate: null,
                showUnsyncedItemCount: false,
                unsyncedItemCount: 0,
            },
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        await loadInitial(this, async () => {
            const nextState = await this.hydrateStateFromLocalStorage(
                previousState,
            )
            await Promise.all([
                this.loadListsData(nextState),
                this.getFeedActivityStatus(),
                this.getInboxUnreadCount(),
                this.runSearch(nextState),
                this.getSyncMenuStatus(),
                this.getSharingAccess(),
            ])
        })
    }

    /* START - Misc helper methods */
    private async hydrateStateFromLocalStorage(
        previousState: State,
    ): Promise<State> {
        const {
            [STORAGE_KEYS.subBannerDismissed]: subBannerDismissed,
            [STORAGE_KEYS.listSidebarLocked]: listsSidebarLocked,
            [STORAGE_KEYS.onboardingMsgSeen]: onboardingMsgSeen,
            [STORAGE_KEYS.mobileAdSeen]: mobileAdSeen,
        } = await this.options.localStorage.get([
            STORAGE_KEYS.subBannerDismissed,
            STORAGE_KEYS.listSidebarLocked,
            STORAGE_KEYS.onboardingMsgSeen,
            STORAGE_KEYS.mobileAdSeen,
        ])

        const mutation: UIMutation<State> = {
            searchResults: {
                showMobileAppAd: { $set: !mobileAdSeen },
                showOnboardingMsg: { $set: !onboardingMsgSeen },
                isSubscriptionBannerShown: { $set: !subBannerDismissed },
            },
            listsSidebar: {
                isSidebarLocked: { $set: listsSidebarLocked ?? true },
            },
        }
        this.emitMutation(mutation)
        return this.withMutation(previousState, mutation)
    }

    private async getSyncMenuStatus() {
        const { syncBG, backupBG } = this.options
        const syncDevices = await syncBG.listDevices()

        const autoBackupEnabled = await backupBG.isAutomaticBackupEnabled()
        const { lastBackup } = await backupBG.getBackupTimes()
        const lastSuccessfulBackup =
            typeof lastBackup === 'number' ? new Date(lastBackup) : null

        const backupState: DisableableState =
            autoBackupEnabled || lastSuccessfulBackup != null
                ? 'enabled'
                : 'disabled'

        let lastSuccessfulSync: Date = null
        try {
            lastSuccessfulSync = new Date(
                await syncBG.retrieveLastSyncTimestamp(),
            )
        } catch (err) {}

        this.emitMutation({
            syncMenu: {
                lastSuccessfulBackupDate: { $set: lastSuccessfulBackup },
                lastSuccessfulSyncDate: { $set: lastSuccessfulSync },
                backupState: { $set: backupState },
                isAutoBackupEnabled: { $set: autoBackupEnabled },
                syncState: {
                    $set: syncDevices.length > 0 ? 'enabled' : 'disabled',
                },
            },
        })
    }

    private async getFeedActivityStatus() {
        const activityStatus = await this.options.activityIndicatorBG.checkActivityStatus()

        this.emitMutation({
            listsSidebar: {
                hasFeedActivity: { $set: activityStatus === 'has-unseen' },
            },
        })
    }

    checkSharingAccess: EventHandler<'checkSharingAccess'> = () =>
        this.getSharingAccess()

    private async getSharingAccess() {
        const isAllowed = await this.options.authBG.isAuthorizedForFeature(
            'beta',
        )

        this.emitMutation({
            searchResults: {
                sharingAccess: {
                    $set: isAllowed ? 'sharing-allowed' : 'feature-disabled',
                },
            },
        })
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

    private async loadListsData(previousState: State) {
        const { listsBG, contentShareBG } = this.options

        const remoteToLocalIdDict: { [remoteId: string]: number } = {}

        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: {
                    localLists: { loadingState: { $set: taskState } },
                },
            }),
            async () => {
                const localLists = await listsBG.fetchAllLists({
                    limit: 1000,
                    skipMobileList: true,
                })

                const localToRemoteIdDict = await contentShareBG.getRemoteListIds(
                    { localListIds: localLists.map((list) => list.id) },
                )

                const listIds: number[] = []
                const listData: { [id: number]: ListData } = {}

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

                this.emitMutation({
                    listsSidebar: {
                        listData: { $merge: listData },
                        localLists: {
                            allListIds: { $set: listIds },
                            filteredListIds: { $set: listIds },
                        },
                    },
                })
            },
        )

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
        this.emitMutation(mutation)
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
        let nextState: State

        const skipMutation: UIMutation<State['searchFilters']> = {
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
                    searchFilters: skipMutation,
                })
                const {
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

                const mutation: UIMutation<State> = event.paginate
                    ? {
                          searchFilters: skipMutation,
                          searchResults: {
                              results: {
                                  $apply: (prev) =>
                                      utils.mergeSearchResults(prev, results),
                              },
                              pageData: {
                                  $apply: (prev) =>
                                      mergeNormalizedStates(prev, pageData),
                              },
                              noteData: {
                                  $apply: (prev) =>
                                      mergeNormalizedStates(prev, noteData),
                              },
                              areResultsExhausted: { $set: resultsExhausted },
                              noResultsType: { $set: noResultsType },
                          },
                      }
                    : {
                          searchFilters: skipMutation,
                          searchResults: {
                              results: { $set: results },
                              pageData: { $set: pageData },
                              noteData: { $set: noteData },
                              areResultsExhausted: { $set: resultsExhausted },
                              noResultsType: { $set: noResultsType },
                          },
                      }

                nextState = this.withMutation(previousState, mutation)
                this.emitMutation(mutation)
            },
        )

        await this.fetchNoteShareStates(nextState)
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

    private async fetchNoteShareStates({
        searchResults: { noteData, noteSharingInfo },
    }: State) {
        const mutation: UIMutation<State['searchResults']> = {}
        const annotationUrls = noteData.allIds.filter(
            (noteId) => !noteSharingInfo[noteId],
        )
        const remoteIds = await this.options.contentShareBG.getRemoteAnnotationIds(
            { annotationUrls },
        )

        const privacyLevels = await this.options.annotationsBG.findAnnotationPrivacyLevels(
            { annotationUrls },
        )

        for (const noteId of annotationUrls) {
            mutation.noteSharingInfo = {
                ...mutation.noteSharingInfo,
                [noteId]: {
                    $set: {
                        taskState: 'pristine',
                        status: remoteIds[noteId] ? 'shared' : 'not-yet-shared',
                        privacyLevel: privacyLevels[noteId],
                    },
                },
            }
        }

        this.emitMutation({ searchResults: mutation })
    }

    private async ensureLoggedIn(
        params: {
            ensureBetaAccess?: boolean
        } = {},
    ): Promise<boolean> {
        const { authBG } = this.options

        const user = await authBG.getCurrentUser()
        if (user != null) {
            const isBetaAuthd = await authBG.isAuthorizedForFeature('beta')

            const mutation: UIMutation<State> = {
                searchResults: {
                    sharingAccess: {
                        $set: isBetaAuthd
                            ? 'sharing-allowed'
                            : 'feature-disabled',
                    },
                },
            }

            if (params.ensureBetaAccess && !isBetaAuthd) {
                this.emitMutation({
                    ...mutation,
                    modals: { showBetaFeature: { $set: true } },
                })
                return false
            }

            this.emitMutation(mutation)
            return true
        }

        this.emitMutation({
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
                if (!(await this.ensureLoggedIn({ ensureBetaAccess: true }))) {
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

    setShowBetaFeatureModal: EventHandler<'setShowBetaFeatureModal'> = ({
        event,
    }) => {
        this.emitMutation({
            modals: {
                showBetaFeature: { $set: event.isShown },
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
    /* END - modal event handlers */

    /* START - search result event handlers */
    setPageSearchResult: EventHandler<'setPageSearchResult'> = ({ event }) => {
        const state = utils.pageSearchResultToState(event.result)
        this.emitMutation({
            searchResults: {
                results: { $set: state.results },
                noteData: { $set: state.noteData },
                pageData: { $set: state.pageData },
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
                noteData: { $set: state.noteData },
                pageData: { $set: state.pageData },
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

    setPageLists: EventHandler<'setPageLists'> = async ({ event }) => {
        this.emitMutation({
            searchResults: {
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

    dragPage: EventHandler<'dragPage'> = async ({ event, previousState }) => {
        const crt = this.options.document.getElementById(DRAG_EL_ID)
        crt.style.display = 'block'
        event.dataTransfer.setDragImage(crt, 10, 10)

        const page = previousState.searchResults.pageData.byId[event.pageId]
        event.dataTransfer.setData(
            'text/plain',
            JSON.stringify({ fullPageUrl: page.fullUrl }),
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

    private updateShareInfoForNoteIds = (params: {
        noteIds: string[]
        previousState: State
        info: Partial<AnnotationSharingInfo>
    }) => {
        const {
            searchResults: { noteSharingInfo },
        } = params.previousState
        const mutation: UIMutation<State['searchResults']> = {}

        for (const noteId of params.noteIds) {
            const prev: AnnotationSharingInfo =
                noteSharingInfo[noteId] ?? ({} as any)
            if (prev?.privacyLevel === AnnotationPrivacyLevels.PROTECTED) {
                continue
            }

            mutation.noteSharingInfo = {
                ...mutation.noteSharingInfo,
                [noteId]: {
                    $set: {
                        ...prev,
                        ...params.info,
                        privacyLevel:
                            params.info.privacyLevel ?? prev.privacyLevel,
                        status: params.info.status ?? prev.status,
                    },
                },
            }
        }

        this.emitMutation({ searchResults: mutation })
    }

    updateAllPageResultNotesShareInfo: EventHandler<
        'updateAllPageResultNotesShareInfo'
    > = async ({ event, previousState }) => {
        this.updateShareInfoForNoteIds({
            previousState,
            info: event.info,
            noteIds: previousState.searchResults.noteData.allIds,
        })
    }

    updatePageNotesShareInfo: EventHandler<
        'updatePageNotesShareInfo'
    > = async ({ event, previousState }) => {
        const { noteData } = previousState.searchResults

        this.updateShareInfoForNoteIds({
            previousState,
            info: event.info,
            noteIds: noteData.allIds.filter(
                (noteId) => noteData.byId[noteId].pageUrl === event.pageId,
            ),
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
                const newNoteId = await annotationsBG.createAnnotation(
                    {
                        pageUrl: event.fullPageUrl,
                        comment: formState.inputValue,
                        privacyLevel: event.privacyLevel,
                    },
                    { skipPageIndexing: true },
                )
                if (formState.tags.length) {
                    await annotationsBG.updateAnnotationTags({
                        url: newNoteId,
                        tags: formState.tags,
                    })
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
                                        pageUrl: event.pageId,
                                        ...utils.getInitialNoteResultState(),
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
                        noteSharingInfo: {
                            [newNoteId]: {
                                $set: {
                                    privacyLevel: event.privacyLevel,
                                    status:
                                        event.privacyLevel ===
                                        AnnotationPrivacyLevels.SHARED
                                            ? 'shared'
                                            : 'not-yet-shared',
                                    taskState: 'pristine',
                                },
                            },
                        },
                    },
                })

                if (event.privacyLevel === AnnotationPrivacyLevels.SHARED) {
                    await contentShareBG
                        .shareAnnotation({
                            annotationUrl: newNoteId,
                            queueInteraction: 'queue-and-return',
                        })
                        .catch(() => {})
                    await contentShareBG
                        .shareAnnotationsToLists({
                            annotationUrls: [newNoteId],
                            queueInteraction: 'queue-and-return',
                        })
                        .catch(() => {})
                    await this.ensureLoggedIn()
                }
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

    updateNoteShareInfo: EventHandler<'updateNoteShareInfo'> = async ({
        event,
        previousState: {
            searchResults: { noteSharingInfo },
        },
    }) => {
        this.emitMutation({
            searchResults: {
                noteSharingInfo: {
                    $merge: {
                        [event.noteId]: {
                            ...noteSharingInfo[event.noteId],
                            ...event.info,
                            privacyLevel:
                                event.info.privacyLevel ??
                                noteSharingInfo[event.noteId].privacyLevel,
                            status:
                                event.info.status ??
                                noteSharingInfo[event.noteId].status,
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
        await this.options.localStorage.set({
            [STORAGE_KEYS.subBannerDismissed]: true,
        })
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
        await this.options.localStorage.set({
            [STORAGE_KEYS.onboardingMsgSeen]: true,
        })
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
            event.mouseEvent.metaKey && event.mouseEvent.altKey

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
        })
    }

    private async showShareOnboardingIfNeeded() {
        const lastShared = await getLastSharedAnnotationTimestamp()

        if (lastShared == null) {
            this.emitMutation({
                modals: { showNoteShareOnboarding: { $set: true } },
            })
        }

        await setLastSharedAnnotationTimestamp()
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
        const { comment, tags } = previousState.searchResults.noteData.byId[
            event.noteId
        ]

        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isEditing: { $set: false },
                            editNoteForm: {
                                isTagPickerShown: { $set: false },
                                inputValue: { $set: comment ?? '' },
                                tags: { $set: tags ?? [] },
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
            ...noteData
        } = previousState.searchResults.noteData.byId[event.noteId]
        const tagsHaveChanged = haveTagsChanged(
            noteData.tags,
            editNoteForm.tags,
        )

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { noteUpdateState: { $set: taskState } },
            }),
            async () => {
                await this.options.annotationsBG.editAnnotation(
                    event.noteId,
                    editNoteForm.inputValue,
                )
                if (tagsHaveChanged) {
                    await this.options.annotationsBG.updateAnnotationTags({
                        url: event.noteId,
                        tags: editNoteForm.tags,
                    })
                }

                this.emitMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [event.noteId]: {
                                    isEditing: { $set: false },
                                    comment: { $set: editNoteForm.inputValue },
                                    tags: { $set: editNoteForm.tags },
                                },
                            },
                        },
                    },
                })
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
                isDateFilterActive: { $set: false },
            },
        })
    }

    toggleShowDatePicker: EventHandler<'toggleShowDatePicker'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: {
                isDateFilterActive: { $set: event.isActive },
                isTagFilterActive: { $set: false },
                isDomainFilterActive: { $set: false },
            },
        })
    }

    toggleShowDomainPicker: EventHandler<'toggleShowDomainPicker'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: {
                isDomainFilterActive: { $set: event.isActive },
                isTagFilterActive: { $set: false },
                isDateFilterActive: { $set: false },
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

        await this.options.localStorage.set({
            [STORAGE_KEYS.listSidebarLocked]: event.isLocked,
        })
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

        if (!newListName.length) {
            return
        }

        if (!isListNameUnique(newListName, previousState.listsSidebar)) {
            this.emitMutation({
                listsSidebar: {
                    addListErrorMessage: {
                        $set: NON_UNIQ_LIST_NAME_ERR_MSG,
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
        const { fullPageUrl } = JSON.parse(
            event.dataTransfer.getData('text/plain'),
        )

        this.options.analytics.trackEvent({
            category: 'Collections',
            action: 'addPageViaDragAndDrop',
        })

        await this.options.listsBG.insertPageToList({
            id: event.listId,
            url: fullPageUrl,
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

    confirmListEdit: EventHandler<'confirmListEdit'> = async ({
        event,
        previousState,
    }) => {
        const { editingListId: listId } = previousState.listsSidebar

        if (!listId) {
            throw new Error('No list ID is set for editing')
        }

        const oldName = previousState.listsSidebar.listData[listId].name
        const newName = event.value.trim()

        if (!newName.length) {
            return
        }

        if (newName === oldName) {
            this.emitMutation({
                listsSidebar: {
                    editingListId: { $set: undefined },
                },
            })
            return
        }

        if (
            !isListNameUnique(newName, previousState.listsSidebar, {
                listIdToSkip: listId,
            })
        ) {
            this.emitMutation({
                listsSidebar: {
                    editListErrorMessage: {
                        $set: NON_UNIQ_LIST_NAME_ERR_MSG,
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

                this.emitMutation({
                    listsSidebar: {
                        listData: {
                            [listId]: { name: { $set: event.value } },
                        },
                        editingListId: { $set: undefined },
                        editListErrorMessage: { $set: null },
                    },
                })
            },
        )
    }

    cancelListEdit: EventHandler<'cancelListEdit'> = async ({}) => {
        this.emitMutation({
            listsSidebar: {
                editListErrorMessage: { $set: null },
                editingListId: { $set: undefined },
            },
        })
    }

    setEditingListId: EventHandler<'setEditingListId'> = async ({
        event,
        previousState,
    }) => {
        const listIdToSet =
            previousState.listsSidebar.editingListId === event.listId
                ? undefined
                : event.listId

        this.emitMutation({
            listsSidebar: {
                editingListId: { $set: listIdToSet },
                showMoreMenuListId: { $set: undefined },
            },
        })
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
            listsSidebar: { showMoreMenuListId: { $set: listIdToSet } },
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
            this.emitMutation({
                listsSidebar: { hasFeedActivity: { $set: false } },
            })
            this.options.annotationsBG
            await this.options.activityIndicatorBG.markActivitiesAsSeen()
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

    setUnsyncedItemCountShown: EventHandler<
        'setUnsyncedItemCountShown'
    > = async ({ event }) => {
        this.emitMutation({
            syncMenu: { showUnsyncedItemCount: { $set: event.isShown } },
        })
    }

    initiateSync: EventHandler<'initiateSync'> = async ({
        event,
        previousState,
    }) => {
        if (previousState.syncMenu.syncState === 'disabled') {
            return
        }

        await executeUITask(
            this,
            (taskState) => ({
                syncMenu: {
                    syncState: { $set: taskState },
                },
            }),
            async () => {
                await this.options.syncBG.forceIncrementalSync()
            },
        )

        this.emitMutation({
            syncMenu: { lastSuccessfulSyncDate: { $set: new Date() } },
        })
    }

    initiateBackup: EventHandler<'initiateBackup'> = async ({
        event,
        previousState,
    }) => {
        if (previousState.syncMenu.backupState === 'disabled') {
            return
        }

        await executeUITask(
            this,
            (taskState) => ({
                syncMenu: {
                    backupState: { $set: taskState },
                },
            }),
            async () => {
                await this.options.backupBG.startBackup()
            },
        )

        this.emitMutation({
            syncMenu: { lastSuccessfulBackupDate: { $set: new Date() } },
        })
    }

    toggleAutoBackup: EventHandler<'toggleAutoBackup'> = async ({
        previousState,
    }) => {
        const { backupBG } = this.options
        if (!(await backupBG.isAutomaticBackupAllowed())) {
            this.emitMutation({
                modals: { showSubscription: { $set: true } },
                syncMenu: { isDisplayed: { $set: false } },
            })
            return
        }

        if (previousState.syncMenu.isAutoBackupEnabled) {
            this.emitMutation({
                syncMenu: { isAutoBackupEnabled: { $set: false } },
            })
            await backupBG.disableAutomaticBackup()
        } else {
            this.emitMutation({
                syncMenu: { isAutoBackupEnabled: { $set: true } },
            })
            await backupBG.enableAutomaticBackup()
        }
    }
    /* END - sync status menu event handlers */
}
