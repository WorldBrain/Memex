import { UILogic, UIEventHandler, UIMutation } from 'ui-logic-core'
import debounce from 'lodash/debounce'
import { AnnotationPrivacyState } from '@worldbrain/memex-common/lib/annotations/types'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import * as utils from './search-results/util'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import { RootState as State, DashboardDependencies, Events } from './types'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { formatTimestamp } from '@worldbrain/memex-common/lib/utils/date-time'
import { DATE_PICKER_DATE_FORMAT as FORMAT } from 'src/dashboard-refactor/constants'
import chrono from 'chrono-node'

import { haveArraysChanged } from 'src/util/have-tags-changed'
import {
    PAGE_SIZE,
    STORAGE_KEYS,
    PAGE_SEARCH_DUMMY_DAY,
    MISSING_PDF_QUERY_PARAM,
} from 'src/dashboard-refactor/constants'
import { STORAGE_KEYS as CLOUD_STORAGE_KEYS } from 'src/personal-cloud/constants'
import {
    updatePickerValues,
    stateToSearchParams,
    flattenNestedResults,
    getListData,
} from './util'
import {
    SPECIAL_LIST_IDS,
    SPECIAL_LIST_NAMES,
} from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { NoResultsType } from './search-results/types'
import { filterListsByQuery } from './lists-sidebar/util'
import { DRAG_EL_ID } from './components/DragElement'
import {
    initNormalizedState,
    mergeNormalizedStates,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
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
import { eventProviderUrls } from '@worldbrain/memex-common/lib/constants'
import { openPDFInViewer } from 'src/pdf/util'
import { hydrateCacheForDashboard } from 'src/annotations/cache/utils'
import type { PageAnnotationsCacheEvents } from 'src/annotations/cache/types'
import type { AnnotationsSearchResponse } from 'src/search/background/types'

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
    currentSearchID = 0

    constructor(private options: DashboardDependencies) {
        super()
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: options.syncSettingsBG,
        })
        window['__annotationsCache'] = options.annotationsCache
    }

    private setupRemoteEventListeners() {
        this.personalCloudEvents = getRemoteEventEmitter('personalCloud')
        this.personalCloudEvents.on('cloudStatsUpdated', ({ stats }) => {
            this.emitMutation({
                syncMenu: {
                    pendingLocalChangeCount: { $set: stats.pendingUploads },
                    // TODO: re-implement pending download count
                    // pendingRemoteChangeCount: { $set: stats.pendingDownloads },
                },
            })
        })
        this.personalCloudEvents.on('downloadStarted', () => {
            this.emitMutation({
                syncMenu: { pendingRemoteChangeCount: { $set: 1 } },
            })
        })
        this.personalCloudEvents.on('downloadStopped', () => {
            this.emitMutation({
                syncMenu: { pendingRemoteChangeCount: { $set: 0 } },
            })
        })
    }

    private getURLSearchParams(): URLSearchParams {
        // Get the current URL of the page
        const url = this.options.location.href

        // Check if the URL has a query string
        const queryStringIndex = url.indexOf('?')
        if (queryStringIndex === -1) {
            return new URLSearchParams() // No query string found
        }

        // Split the query string into key-value pairs
        const queryString = url.substring(queryStringIndex + 1)
        return new URLSearchParams(queryString)
    }

    // TODO: Update this to use the URLSearchParams API rather than string manipulation
    private updateQueryStringParameter(key: string, value: string) {
        // Get the current URL of the page
        if (value != null) {
            const url = this.options.location.href

            let regex = new RegExp(`(${key}=)[^&]+`)
            let match = url.match(regex)

            let updatedUrl = url
            if (match) {
                // update the query parameter value
                let updatedParam = `${key}=${value}`

                // replace the old query parameter with the updated one
                updatedUrl = url.replace(match[0], updatedParam)
            } else {
                if (!url.includes('?')) {
                    // add the query parameter to the URL
                    updatedUrl = `${url}?${key}=${value}`
                } else {
                    // add the query parameter to the URL
                    updatedUrl = `${url}&${key}=${value}`
                }
            }
            if (process.env.NODE_ENV !== 'test') {
                // Replace the current URL with the new one
                this.options.location.replace(updatedUrl)
            }
        }
    }

    private removeQueryString(key) {
        // Get the current URL of the page
        const url = this.options.location.href

        // Regular expression to match the query parameter key and its value
        const regex = new RegExp('([?&])' + key + '=([^&]*)')

        // Remove the query parameter from the URL
        const updatedUrl = url.replace(regex, (match, p1) => {
            return p1 === '?' ? '?' : ''
        })

        // If the last character is a '?', remove it
        const cleanUrl = updatedUrl.replace(/[?]$/, '')

        // Replace the current URL with the new one
        this.options.history.replaceState({}, '', cleanUrl)
    }

    getInitialState(): State {
        const urlSearchParams = this.getURLSearchParams()
        const searchQuery = urlSearchParams.get('query')
        const spacesQuery = urlSearchParams.get('spaces')
        const fromQuery = urlSearchParams.get('from')
        const from = formatTimestamp(parseFloat(fromQuery), FORMAT)
        const toQuery = urlSearchParams.get('to')

        const to = formatTimestamp(parseFloat(toQuery), FORMAT)

        let spacesArray: any[] // TODO: this type should be string[]

        if (spacesQuery && spacesQuery.includes(',')) {
            spacesArray = spacesQuery.split(',')
        } else {
            spacesArray = [spacesQuery]
        }

        let openFilterBarOnLoad: boolean
        if ((spacesQuery && spacesArray.length > 1) || fromQuery || toQuery) {
            openFilterBarOnLoad = true
        } else {
            openFilterBarOnLoad = false
        }

        return {
            currentUser: null,
            loadState: 'pristine',
            mode: isDuringInstall(this.options.location)
                ? 'onboarding'
                : 'search',
            showDropArea: this.options.location.href.includes(
                MISSING_PDF_QUERY_PARAM,
            ),

            modals: {
                showLogin: false,
                showSubscription: false,
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
                activeDay: undefined,
                activePageID: undefined,
                clearInboxLoadState: 'pristine',
            },
            searchFilters: {
                searchQuery: searchQuery ?? '',
                domainsExcluded: [],
                domainsIncluded: [],
                isDateFilterActive: false,
                isSpaceFilterActive: false,
                isDomainFilterActive: false,
                isTagFilterActive: false,
                searchFiltersOpen: openFilterBarOnLoad ? true : false,
                spacesIncluded: spacesArray.length > 1 ? spacesArray : [],
                tagsExcluded: [],
                tagsIncluded: [],
                dateFromInput: fromQuery ? from : null,
                dateToInput: toQuery ? to : null,
                limit: PAGE_SIZE,
                skip: 0,
            },
            listsSidebar: {
                spaceSidebarWidth: sizeConstants.listsSidebar.width,
                addListErrorMessage: null,
                editListErrorMessage: null,
                listShareLoadingState: 'pristine',
                listCreateState: 'pristine',
                listDeleteState: 'pristine',
                listEditState: 'pristine',
                listLoadState: 'pristine',
                isSidebarPeeking: false,
                isSidebarLocked: false,
                hasFeedActivity: false,
                inboxUnreadCount: 0,
                searchQuery: '',
                lists: initNormalizedState(),
                filteredListIds: [],
                isAddListInputShown: false,
                areLocalListsExpanded: true,
                areFollowedListsExpanded: true,
                areJoinedListsExpanded: true,
                selectedListId: null,
                showFeed: false,
            },
            syncMenu: {
                isDisplayed: false,
                pendingLocalChangeCount: 0,
                pendingRemoteChangeCount: 0,
                lastSuccessfulSyncDate: null,
            },
        }
    }

    private cacheListsSubscription: PageAnnotationsCacheEvents['newListsState'] = (
        nextLists,
    ) => {
        this.emitMutation({ listsSidebar: { lists: { $set: nextLists } } })
    }

    private cacheAnnotationsSubscription: PageAnnotationsCacheEvents['newAnnotationsState'] = (
        nextAnnotations,
    ) => {}

    init: EventHandler<'init'> = async ({ previousState }) => {
        const { annotationsCache } = this.options
        this.setupRemoteEventListeners()
        const searchParams = this.getURLSearchParams()
        const spacesQuery = searchParams.get('spaces')
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        let spacesArray = spacesQuery && [spacesQuery]

        annotationsCache.events.addListener(
            'newAnnotationsState',
            this.cacheAnnotationsSubscription,
        )
        annotationsCache.events.addListener(
            'newListsState',
            this.cacheListsSubscription,
        )

        await loadInitial(this, async () => {
            await executeUITask(
                this,
                (taskState) => ({
                    listsSidebar: { listLoadState: { $set: taskState } },
                }),
                async () => {
                    await hydrateCacheForDashboard({
                        cache: annotationsCache,
                        bgModules: {
                            customLists: this.options.listsBG,
                            annotations: this.options.annotationsBG,
                            contentSharing: this.options.contentShareBG,
                            pageActivityIndicator: this.options
                                .pageActivityIndicatorBG,
                        },
                    })
                },
            )

            let nextState = await this.loadAuthStates(previousState)
            nextState = await this.hydrateStateFromLocalStorage(nextState)

            if (spacesArray && spacesArray.length === 1) {
                const listData = this.options.annotationsCache.getListByLocalId(
                    parseFloat(spacesArray[0]),
                )
                if (listData) {
                    this.mutateAndTriggerSearch(previousState, {
                        listsSidebar: {
                            selectedListId: { $set: listData.unifiedId },
                        },
                    })
                }
            } else if ((from && from.length) || (to && to.length)) {
                await this.mutateAndTriggerSearch(previousState, {
                    searchFilters: {
                        dateFrom: { $set: from ? parseFloat(from) : undefined },
                        dateTo: { $set: to ? parseFloat(to) : undefined },
                    },
                })
            } else {
                await this.runSearch(nextState)
            }
            await this.getFeedActivityStatus()
            await this.getInboxUnreadCount()
        })
    }

    cleanup: EventHandler<'cleanup'> = async ({}) => {
        this.personalCloudEvents.removeAllListeners()
        this.options.annotationsCache.events.removeListener(
            'newAnnotationsState',
            this.cacheAnnotationsSubscription,
        )
        this.options.annotationsCache.events.removeListener(
            'newListsState',
            this.cacheListsSubscription,
        )
    }

    /* START - Misc helper methods */
    private async hydrateStateFromLocalStorage(
        previousState: State,
    ): Promise<State> {
        const { localStorage } = this.options
        const {
            [CLOUD_STORAGE_KEYS.lastSeen]: cloudLastSynced,
            [STORAGE_KEYS.mobileAdSeen]: mobileAdSeen,
        } = await localStorage.get([
            CLOUD_STORAGE_KEYS.lastSeen,
            STORAGE_KEYS.mobileAdSeen,
        ])

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
            searchResults: {
                showMobileAppAd: { $set: !mobileAdSeen },
                shouldShowTagsUIs: { $set: !areTagsMigrated },
                showOnboardingMsg: { $set: !onboardingMsgSeen },
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

    setSpaceSidebarWidth: EventHandler<'setSpaceSidebarWidth'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                spaceSidebarWidth: { $set: event.width },
            },
        })
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

    // private async loadLocalListsData(previousState: State) {
    //     const { listsBG, contentShareBG } = this.options

    //     const remoteToLocalIdDict: { [remoteId: string]: number } = {}
    //     const mutation: UIMutation<State> = {}

    //     await executeUITask(
    //         this,
    //         (taskState) => ({
    //             listsSidebar: {
    //                 localLists: { loadingState: { $set: taskState } },
    //             },
    //         }),
    //         async () => {
    //             let allLists = await listsBG.fetchAllLists({
    //                 limit: 1000,
    //                 skipMobileList: true,
    //                 includeDescriptions: true,
    //             })

    //             let joinedLists = await listsBG.fetchCollaborativeLists({
    //                 limit: 1000,
    //             })

    //             // a list of all local lists that also have a remote list (could be joined or created)
    //             let localToRemoteIdDict = await contentShareBG.getRemoteListIds(
    //                 { localListIds: allLists.map((list) => list.id) },
    //             )

    //             // transform the localToRemoteIdDict into an array that can be filtered
    //             let localToRemoteIdAsArray = [
    //                 ...Object.entries(localToRemoteIdDict),
    //             ].map(([localListId, remoteId]) => ({ localListId, remoteId }))

    //             // check for all local entries that also have remoteentries, and cross check them with the joined lists, keep only the ones that are not in joined lists
    //             const localListsWithoutJoinedStatusButMaybeShared = localToRemoteIdAsArray.filter(
    //                 (item) => {
    //                     return !joinedLists.some(
    //                         (list) => list.remoteId === item.remoteId,
    //                     )
    //                 },
    //             )

    //             // get the locallists by filtering out all IDs that are in the filteredArray
    //             let localListsNotJoinedButShared = allLists.filter((item) => {
    //                 return localListsWithoutJoinedStatusButMaybeShared.some(
    //                     (list) => parseInt(list.localListId) === item.id,
    //                 )
    //             })
    //             let localListsNotShared = allLists.filter((item) => {
    //                 return !localToRemoteIdAsArray.some(
    //                     (list) => parseInt(list.localListId) === item.id,
    //                 )
    //             })

    //             let localLists = [
    //                 ...localListsNotShared,
    //                 ...localListsNotJoinedButShared,
    //             ]

    //             const listIds: number[] = []
    //             const listData: { [id: number]: ListData } = {}

    //             localLists = localLists.sort((listDataA, listDataB) => {
    //                 if (
    //                     listDataA.name.toLowerCase() <
    //                     listDataB.name.toLowerCase()
    //                 ) {
    //                     return -1
    //                 }
    //                 if (
    //                     listDataA.name.toLowerCase() >
    //                     listDataB.name.toLowerCase()
    //                 ) {
    //                     return 1
    //                 }
    //                 return 0
    //             })

    //             for (const list of allLists) {
    //                 const remoteId = localToRemoteIdDict[list.id]
    //                 if (remoteId) {
    //                     remoteToLocalIdDict[remoteId] = list.id
    //                 }
    //             }

    //             for (const list of localLists) {
    //                 const remoteId = localToRemoteIdDict[list.id]
    //                 listIds.push(list.id)
    //                 listData[list.id] = {
    //                     remoteId,
    //                     id: list.id,
    //                     name: list.name,
    //                     isOwnedList: true,
    //                     description: list.description,
    //                 }
    //             }

    //             mutation.listsSidebar = {
    //                 listData: { $merge: listData },
    //                 localLists: {
    //                     allListIds: { $set: listIds },
    //                     filteredListIds: { $set: listIds },
    //                 },
    //             }
    //             this.emitMutation(mutation)
    //         },
    //     )

    //     return {
    //         nextState: this.withMutation(previousState, mutation),
    //         remoteToLocalIdDict,
    //     }
    // }
    // private async loadJoinedListsData(previousState: State) {
    //     const remoteToLocalIdDict: { [remoteId: string]: number } = {}
    //     const mutation: UIMutation<State> = {}

    //     await executeUITask(
    //         this,
    //         (taskState) => ({
    //             listsSidebar: {
    //                 joinedLists: { loadingState: { $set: taskState } },
    //             },
    //         }),
    //         async () => {
    //             let joinedLists = await this.options.listsBG.fetchCollaborativeLists(
    //                 {
    //                     skip: 0,
    //                     limit: 120,
    //                 },
    //             )

    //             // const localToRemoteIdDict = await contentShareBG.getRemoteListIds(
    //             //     { localListIds: joinedLists.map((list) => list.id) },
    //             // )

    //             const listIds: number[] = []
    //             const listData: { [id: number]: ListData } = {}

    //             joinedLists = joinedLists.sort((listDataA, listDataB) => {
    //                 if (
    //                     listDataA.name.toLowerCase() <
    //                     listDataB.name.toLowerCase()
    //                 ) {
    //                     return -1
    //                 }
    //                 if (
    //                     listDataA.name.toLowerCase() >
    //                     listDataB.name.toLowerCase()
    //                 ) {
    //                     return 1
    //                 }
    //                 return 0
    //             })

    //             for (const list of joinedLists) {
    //                 listIds.push(list.id)
    //                 listData[list.id] = {
    //                     remoteId: list.remoteId,
    //                     id: list.id,
    //                     name: list.name,
    //                     isOwnedList: false,
    //                     description: list.description,
    //                 }
    //             }

    //             mutation.listsSidebar = {
    //                 listData: { $merge: listData },
    //                 joinedLists: {
    //                     allListIds: { $set: listIds },
    //                     filteredListIds: { $set: listIds },
    //                 },
    //             }
    //             this.emitMutation(mutation)
    //         },
    //     )

    //     return {
    //         nextState: this.withMutation(previousState, mutation),
    //         remoteToLocalIdDict,
    //     }
    // }

    // private async loadRemoteListsData(
    //     previousState: State,
    //     remoteToLocalIdDict: {
    //         [remoteId: string]: number
    //     },
    // ) {
    //     const { listsBG } = this.options

    //     await executeUITask(
    //         this,
    //         (taskState) => ({
    //             listsSidebar: {
    //                 followedLists: { loadingState: { $set: taskState } },
    //             },
    //         }),
    //         async () => {
    //             const followedLists = await listsBG.fetchAllFollowedLists({
    //                 limit: 1000,
    //             })

    //             const followedListIds: number[] = []
    //             const listData: { [id: number]: ListData } = {}

    //             for (const list of followedLists) {
    //                 const localId =
    //                     remoteToLocalIdDict[list.remoteId] ?? list.id

    //                 // Joined lists appear in "Local lists" section, so don't include them here
    //                 if (remoteToLocalIdDict[list.remoteId] == null) {
    //                     followedListIds.push(localId)
    //                 }

    //                 listData[localId] = {
    //                     id: localId,
    //                     name: list.name,
    //                     remoteId: list.remoteId,
    //                     description: list.description,
    //                     isOwnedList: list.isOwned,
    //                     // NOTE: this condition assumes that local lists are loaded in state already (joined lists have local data + are "followed")
    //                     isJoinedList:
    //                         previousState.listsSidebar.listData[localId] !=
    //                         null,
    //                 }
    //             }

    //             this.emitMutation({
    //                 listsSidebar: {
    //                     listData: { $merge: listData },
    //                     followedLists: {
    //                         allListIds: { $set: followedListIds },
    //                         filteredListIds: { $set: followedListIds },
    //                     },
    //                 },
    //             })
    //         },
    //     )
    // }

    /**
     * Helper which emits a mutation followed by a search using the post-mutation state.
     */
    private async mutateAndTriggerSearch(
        previousState: State,
        mutation: UIMutation<State>,
    ) {
        this.emitMutation({
            searchResults: {
                searchState: { $set: 'running' },
            },
        })

        mutation = {
            ...mutation,
            mode: { $set: 'search' },
            listsSidebar: {
                ...(mutation['listsSidebar'] ?? {}),
                showFeed: { $set: false },
            },
        }

        this.emitMutation(mutation)
        const nextState = this.withMutation(previousState, mutation)
        this.runSearch(nextState)
    }

    private runSearch = debounce(
        async (previousState: State, paginate?: boolean) => {
            await this.search({ previousState, event: { paginate } })
        },
        200,
    )

    // leaving this here for now in order to finalise the feature for handling the race condition rendering

    /* END - Misc helper methods */

    /* START - Misc event handlers */
    search: EventHandler<'search'> = async ({ previousState, event }) => {
        const searchID = ++this.currentSearchID
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
                        : 'searchState']: {
                        $set: taskState,
                    },
                },
            }),

            async () => {
                const searchState = this.withMutation(previousState, {
                    searchFilters,
                })

                if (searchID !== this.currentSearchID) {
                    return
                } else {
                    let {
                        noteData,
                        pageData,
                        results,
                        resultsExhausted,
                        searchTermsInvalid,
                    } =
                        previousState.searchResults.searchType === 'pages' ||
                        previousState.searchResults.searchType === 'videos' ||
                        previousState.searchResults.searchType === 'events' ||
                        previousState.searchResults.searchType === 'twitter'
                            ? await this.searchPages(searchState)
                            : previousState.searchResults.searchType === 'notes'
                            ? await this.searchNotes(searchState)
                            : await this.searchPDFs(searchState)

                    let noResultsType: NoResultsType = null
                    if (
                        resultsExhausted &&
                        searchState.searchFilters.skip === 0 &&
                        !pageData.allIds.length
                    ) {
                        if (
                            previousState.listsSidebar.selectedListId != null &&
                            getListData(
                                previousState.listsSidebar.selectedListId,
                                previousState,
                                { mustBeLocal: true, source: 'search' },
                            ).localId === SPECIAL_LIST_IDS.MOBILE
                        ) {
                            noResultsType = previousState.searchResults
                                .showMobileAppAd
                                ? 'mobile-list-ad'
                                : 'mobile-list'
                        } else if (
                            previousState.searchResults.showOnboardingMsg
                        ) {
                            noResultsType = 'onboarding-msg'
                        } else {
                            noResultsType = searchTermsInvalid
                                ? 'stop-words'
                                : 'no-results'
                        }
                    }

                    if (searchID !== this.currentSearchID) {
                        return
                    }

                    this.emitMutation({
                        searchFilters,
                        searchResults: {
                            areResultsExhausted: {
                                $set: resultsExhausted,
                            },
                            searchState: { $set: 'success' },
                            searchPaginationState: { $set: 'success' },
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
                                              mergeNormalizedStates(
                                                  prev,
                                                  pageData,
                                              ),
                                      },
                                      noteData: {
                                          $apply: (prev) =>
                                              mergeNormalizedStates(
                                                  prev,
                                                  noteData,
                                              ),
                                      },
                                  }
                                : {
                                      results: { $set: results },
                                      pageData: { $set: pageData },
                                      noteData: { $set: noteData },
                                  }),
                        },
                    })
                }
            },
        )
    }

    private searchPages = async (state: State) => {
        const result = await this.options.searchBG.searchPages(
            stateToSearchParams(state, this.options.annotationsCache),
        )

        if (state.searchResults.searchType === 'events') {
            result.docs = result.docs.filter((item) => {
                return eventProviderUrls.some((items) =>
                    item.fullUrl.includes(items),
                )
            })
        }

        return {
            ...utils.pageSearchResultToState(
                result,
                this.options.annotationsCache,
            ),
            resultsExhausted: result.resultsExhausted,
            searchTermsInvalid: result.isBadTerm,
        }
    }

    private searchPDFs = async (state: State) => {
        let result = await this.options.searchBG.searchPages(
            stateToSearchParams(state, this.options.annotationsCache),
        )

        const pdfResults = result.docs.filter((x) => x.url.endsWith('.pdf'))

        result = {
            docs: pdfResults,
            resultsExhausted: result.resultsExhausted,
            isBadTerm: result.isBadTerm,
        }

        return {
            ...utils.pageSearchResultToState(
                result,
                this.options.annotationsCache,
            ),
            resultsExhausted: result.resultsExhausted,
            searchTermsInvalid: result.isBadTerm,
        }
    }

    private searchNotes = async (state: State) => {
        const result = await this.options.searchBG.searchAnnotations(
            stateToSearchParams(state, this.options.annotationsCache),
        )

        return {
            ...utils.annotationSearchResultToState(
                result as AnnotationsSearchResponse,
                this.options.annotationsCache,
            ),
            resultsExhausted: result.resultsExhausted,
            searchTermsInvalid: result.isBadTerm,
        }
    }

    private async ensureLoggedIn(): Promise<boolean> {
        const { authBG } = this.options

        const user = await authBG.getCurrentUser()
        if (user != null) {
            this.emitMutation({ currentUser: { $set: user } })

            if (!user.displayName?.length) {
                const userProfile = await authBG.getUserProfile()
                if (!userProfile?.displayName?.length) {
                    this.emitMutation({
                        modals: { showDisplayNameSetup: { $set: true } },
                    })
                    return false
                }
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

                this.emitMutation({
                    modals: {
                        shareListId: { $set: listId },
                    },
                    listsSidebar: {
                        showMoreMenuListId: { $set: undefined },
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

    setShowNoteShareOnboardingModal: EventHandler<
        'setShowNoteShareOnboardingModal'
    > = ({ event }) => {
        this.emitMutation({
            modals: {
                showNoteShareOnboarding: { $set: event.isShown },
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
    /* END - modal event handlers */

    /* START - search result event handlers */
    setPageSearchResult: EventHandler<'setPageSearchResult'> = ({ event }) => {
        const state = utils.pageSearchResultToState(
            event.result,
            this.options.annotationsCache,
        )
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
        const state = utils.annotationSearchResultToState(
            event.result,
            this.options.annotationsCache,
        )
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
        const listData = getListData(
            event.added ?? event.deleted,
            previousState,
            { mustBeLocal: true, source: 'setPageLists' },
        )
        const removingSharedList =
            event.deleted != null && listData.remoteId != null

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
            added: event.added && listData.localId,
            deleted: event.deleted && listData.localId,
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
        event.dataTransfer.setDragImage(crt, 0, 0)

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
        previousState,
    }) => {
        if (previousState.listsSidebar.selectedListId == null) {
            throw new Error('No list is currently filtered to remove page from')
        }
        const listData = getListData(
            previousState.listsSidebar.selectedListId,
            previousState,
            { mustBeLocal: true, source: 'removePageFromList' },
        )
        const filterOutPage = (ids: string[]) =>
            ids.filter((id) => id !== event.pageId)

        const mutation: UIMutation<State['searchResults']> = {
            pageData: {
                byId: { $unset: [event.pageId] },
                allIds: {
                    $set: filterOutPage(
                        previousState.searchResults.pageData.allIds,
                    ),
                },
            },
        }

        if (event.day === PAGE_SEARCH_DUMMY_DAY) {
            mutation.results = {
                [PAGE_SEARCH_DUMMY_DAY]: {
                    pages: {
                        byId: { $unset: [event.pageId] },
                        allIds: {
                            $set: filterOutPage(
                                previousState.searchResults.results[
                                    PAGE_SEARCH_DUMMY_DAY
                                ].pages.allIds,
                            ),
                        },
                    },
                },
            }
        } else {
            mutation.results = removeAllResultOccurrencesOfPage(
                previousState.searchResults.results,
                event.pageId,
            )
        }
        this.emitMutation({
            searchResults: mutation,
            listsSidebar:
                listData.localId === SPECIAL_LIST_IDS.INBOX
                    ? {
                          inboxUnreadCount: { $apply: (count) => count - 1 },
                      }
                    : {},
        })

        await this.options.listsBG.removePageFromList({
            id: listData.localId,
            url: event.pageId,
        })
    }

    clearInbox: EventHandler<'clearInbox'> = async () => {
        const listContent = await this.options.listsBG.fetchListById({
            id: SPECIAL_LIST_IDS.INBOX,
        })
        const pages = listContent.pages
        const filterOutPages = (pages: string[]) =>
            pages.filter((page) => page === '')

        this.emitMutation({
            searchResults: {
                results: {
                    [PAGE_SEARCH_DUMMY_DAY]: {
                        pages: {
                            allIds: {
                                $set: [],
                            },
                        },
                    },
                },
                clearInboxLoadState: { $set: 'running' },
            },
            listsSidebar: {
                inboxUnreadCount: { $set: 0 },
            },
        })

        for (let page of pages) {
            await this.options.listsBG.removePageFromList({
                id: SPECIAL_LIST_IDS.INBOX,
                url: page,
            })
        }

        this.emitMutation({
            searchResults: {
                clearInboxLoadState: { $set: 'pristine' },
            },
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

                this.emitMutation({
                    searchResults: resultsMutation,
                    modals: {
                        deletingPageArgs: { $set: undefined },
                    },
                })
                await this.options.searchBG.delPages([pageId])
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
                                    listPickerShowStatus: {
                                        $apply: (prev) =>
                                            prev === event.show
                                                ? 'hide'
                                                : event.show,
                                    },
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

        // if (event.isShown) {
        //     await this.showShareOnboardingIfNeeded()
        // }

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

    setActivePage: EventHandler<'setActivePage'> = ({
        event,
        previousState,
    }) => {
        if (event.activePageID == null && event.activeDay == null) {
            this.emitMutation({
                activeDay: { $set: undefined },
                activePageID: { $set: undefined },
                searchResults: {
                    results: {
                        [previousState.activeDay]: {
                            pages: {
                                byId: {
                                    [previousState.activePageID]: {
                                        activePage: {
                                            $set: false,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            })
        }

        this.emitMutation({
            searchResults: {
                results: {
                    [event.activeDay]: {
                        pages: {
                            byId: {
                                [event.activePageID]: {
                                    activePage: {
                                        $set: event.activePage,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            activeDay: { $set: event.activeDay },
            activePageID: { $set: event.activePageID },
        })
        this.emitMutation({
            searchResults: {
                results: {
                    [previousState.activeDay]: {
                        pages: {
                            byId: {
                                [previousState.activePageID]: {
                                    activePage: {
                                        $set: false,
                                    },
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

    setPageHover: EventHandler<'setPageHover'> = ({ event, previousState }) => {
        if (
            previousState.searchResults.results[event.day].pages.byId[
                event.pageId
            ].isCopyPasterShown ||
            previousState.searchResults.results[event.day].pages.byId[
                event.pageId
            ].listPickerShowStatus !== 'hide'
        ) {
            return
        }

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
        const formState =
            previousState.searchResults.results[event.day].pages.byId[
                event.pageId
            ].newNoteForm
        const listsToAdd = formState.lists.map((listId) =>
            getListData(listId, previousState, {
                mustBeLocal: true,
                source: 'savePageNewNote',
            }),
        )

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
                        comment: formState.inputValue,
                        fullPageUrl: event.fullPageUrl,
                        localListIds: listsToAdd.map((list) => list.localId),
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
                                        lists: formState.lists ?? [],
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
                            listPickerShowStatus: {
                                $apply: (prev) =>
                                    prev === event.show ? 'hide' : event.show,
                            },
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
        const listData = getListData(
            event.added ?? event.deleted,
            previousState,
            { mustBeLocal: true, source: 'setNoteLists' },
        )
        const isSharedList = listData?.remoteId != null

        let remoteFn: () => Promise<any>

        const noteListIds = new Set(noteData.lists)
        const pageListIds = new Set(pageData.lists)

        if (event.added != null) {
            remoteFn = () =>
                contentShareBG.shareAnnotationToSomeLists({
                    annotationUrl: event.noteId,
                    localListIds: [listData.localId],
                    protectAnnotation: event.protectAnnotation,
                })
            noteListIds.add(event.added)
            pageListIds.add(event.added)
        } else if (event.deleted != null) {
            remoteFn = () =>
                contentShareBG.unshareAnnotationFromList({
                    annotationUrl: event.noteId,
                    localListId: listData.localId,
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
                    getListData(listId, params.previousState)?.remoteId == null,
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
        const cachedAnnotation = this.options.annotationsCache.getAnnotationByLocalId(
            event.noteId,
        )
        const pageData =
            previousState.searchResults.pageData.byId[
                cachedAnnotation.normalizedPageUrl
            ]
        if (!cachedAnnotation) {
            console.warn(
                'Tried to go to highlight from dashboard but could not find associated annotation in cache:',
                event,
            )
            return
        }
        if (!pageData?.fullUrl) {
            console.warn(
                'Tried to go to highlight from dashboard but could not find associated page data:',
                event,
                previousState.searchResults.pageData,
            )
        }

        await this.options.contentScriptsBG.goToAnnotationFromDashboardSidebar({
            fullPageUrl: pageData.fullUrl,
            annotationCacheId: cachedAnnotation.unifiedId,
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
        this.updateQueryStringParameter('query', event.query)

        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { searchQuery: { $set: event.query } },
        })
    }

    setSearchFiltersOpen: EventHandler<'setSearchFiltersOpen'> = async ({
        event,
        previousState,
    }) => {
        if (event.isOpen) {
            this.emitMutation({
                searchFilters: { searchFiltersOpen: { $set: event.isOpen } },
            })
        }

        if (previousState.searchFilters.searchFiltersOpen) {
            this.emitMutation({
                searchFilters: { searchFiltersOpen: { $set: false } },
            })
            await this.processUIEvent('resetFilters', {
                event: null,
                previousState,
            })
        } else {
            this.emitMutation({
                searchFilters: { searchFiltersOpen: { $set: true } },
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
        this.updateQueryStringParameter(
            'from',
            chrono.parseDate(event.value).getTime(),
        )

        this.emitMutation({
            searchFilters: { dateFromInput: { $set: event.value } },
        })
    }

    setDateToInputValue: EventHandler<'setDateToInputValue'> = async ({
        event,
    }) => {
        this.updateQueryStringParameter(
            'to',
            chrono.parseDate(event.value).getTime(),
        )

        this.emitMutation({
            searchFilters: { dateToInput: { $set: event.value } },
        })
    }

    setDateFrom: EventHandler<'setDateFrom'> = async ({
        event,
        previousState,
    }) => {
        this.updateQueryStringParameter('from', event.value.toString())

        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { dateFrom: { $set: event.value } },
        })
    }

    setDateTo: EventHandler<'setDateTo'> = async ({ event, previousState }) => {
        this.updateQueryStringParameter('to', event.value.toString())
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
        this.updateQueryStringParameter(
            'spaces',
            previousState.searchFilters.spacesIncluded.length > 0
                ? previousState.searchFilters.spacesIncluded +
                      ',' +
                      event.spaceId
                : event.spaceId.toString(),
        )

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
        this.removeQueryString('spaces')
        this.removeQueryString('from')
        this.removeQueryString('to')

        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: { $set: this.getInitialState().searchFilters },
            listsSidebar: { selectedListId: { $set: undefined } },
        })
        this.emitMutation({
            searchFilters: { searchFiltersOpen: { $set: false } },
        })
    }

    setSidebarLocked: EventHandler<'setSidebarLocked'> = async ({
        event,
        previousState,
    }) => {
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
        previousState,
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
        const filteredLists = filterListsByQuery(
            event.query,
            normalizedStateToArray(previousState.listsSidebar.lists),
        )

        this.emitMutation({
            listsSidebar: {
                searchQuery: { $set: event.query },
                filteredListIds: {
                    $set: filteredLists.map((list) => list.unifiedId),
                },
            },
        })
    }

    setAddListInputShown: EventHandler<'setAddListInputShown'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                isAddListInputShown: { $set: event.isShown },
                areLocalListsExpanded: { $set: event.isShown },
            },
        })
    }

    cancelListCreate: EventHandler<'cancelListCreate'> = async ({ event }) => {
        this.emitMutation({
            listsSidebar: {
                addListErrorMessage: { $set: null },
                isAddListInputShown: { $set: false },
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
            normalizedStateToArray(previousState.listsSidebar.lists)
                .filter((list) => list.localId != null)
                .map((list) => ({ id: list.unifiedId, name: list.name })),
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
                const localListId = Date.now()
                const { unifiedId } = this.options.annotationsCache.addList({
                    name: newListName,
                    localId: localListId,
                    unifiedAnnotationIds: [],
                    hasRemoteAnnotationsToLoad: false,
                    creator:
                        previousState.currentUser != null
                            ? {
                                  type: 'user-reference',
                                  id: previousState.currentUser.id,
                              }
                            : undefined,
                })

                this.emitMutation({
                    listsSidebar: {
                        isAddListInputShown: { $set: false },
                        filteredListIds: { $unshift: [unifiedId] },
                        areLocalListsExpanded: { $set: true },
                        addListErrorMessage: { $set: null },
                    },
                })
                await this.options.listsBG.createCustomList({
                    name: newListName,
                    id: localListId,
                })
            },
        )
    }

    setLocalListsExpanded: EventHandler<'setLocalListsExpanded'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                areLocalListsExpanded: { $set: event.isExpanded },
                isAddListInputShown: { $set: !event.isExpanded && false },
            },
        })
    }

    setFollowedListsExpanded: EventHandler<
        'setFollowedListsExpanded'
    > = async ({ event }) => {
        this.emitMutation({
            listsSidebar: {
                areFollowedListsExpanded: { $set: event.isExpanded },
            },
        })
    }

    setJoinedListsExpanded: EventHandler<'setJoinedListsExpanded'> = async ({
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                areJoinedListsExpanded: { $set: event.isExpanded },
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

        this.updateQueryStringParameter('spaces', listIdToSet)

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
        previousState,
    }) => {
        const { fullPageUrl, normalizedPageUrl } = JSON.parse(
            event.dataTransfer.getData('text/plain'),
        ) as { fullPageUrl: string; normalizedPageUrl: string }

        if (!fullPageUrl || !normalizedPageUrl) {
            return
        }

        const listData = getListData(event.listId, previousState, {
            mustBeLocal: true,
            source: 'dropPageOnListItem',
        })

        this.options.analytics.trackEvent({
            category: 'Collections',
            action: 'addPageViaDragAndDrop',
        })

        this.emitMutation({
            listsSidebar: {
                dragOverListId: { $set: undefined },
                lists: {
                    byId: {
                        [event.listId]: {
                            wasPageDropped: { $set: true },
                        },
                    },
                },
            },
            searchResults: {
                pageData: {
                    byId: {
                        [normalizedPageUrl]: {
                            lists: {
                                $apply: (lists: string[]) =>
                                    lists.includes(event.listId)
                                        ? lists
                                        : [...lists, event.listId],
                            },
                        },
                    },
                },
            },
        })

        await Promise.all([
            this.options.listsBG.insertPageToList({
                id: listData.localId!,
                url: fullPageUrl,
                skipPageIndexing: true,
            }),
            new Promise<void>((resolve) =>
                setTimeout(() => {
                    this.emitMutation({
                        listsSidebar: {
                            lists: {
                                byId: {
                                    [event.listId]: {
                                        wasPageDropped: { $set: false },
                                    },
                                },
                            },
                        },
                    })
                    resolve()
                }, 2000),
            ),
        ])
    }

    clickPageResult: EventHandler<'clickPageResult'> = async ({
        event,
        previousState,
    }) => {
        const pageData = previousState.searchResults.pageData.byId[event.pageId]
        if (!pageData || pageData.fullPdfUrl == null) {
            return
        }

        event.synthEvent.preventDefault()

        if (pageData.fullPdfUrl!.startsWith('blob:')) {
            // Show dropzone for local-only PDFs
            this.emitMutation({ showDropArea: { $set: true } })
        } else {
            await openPDFInViewer(pageData.fullPdfUrl!, {
                tabsAPI: this.options.tabsAPI,
                runtimeAPI: this.options.runtimeAPI,
            })
        }
    }

    dropPdfFile: EventHandler<'dropPdfFile'> = async ({ event }) => {
        event.preventDefault()
        this.emitMutation({ showDropArea: { $set: false } })
        const firstItem = event.dataTransfer?.items?.[0]
        if (!firstItem) {
            return
        }
        try {
            const file = firstItem.getAsFile()
            const pdfObjectUrl = URL.createObjectURL(file)

            await openPDFInViewer(pdfObjectUrl, {
                tabsAPI: this.options.tabsAPI,
                runtimeAPI: this.options.runtimeAPI,
            })
        } catch (err) {}
    }

    dragFile: EventHandler<'dragFile'> = async ({ event }) => {
        const firstItem = event?.dataTransfer?.items?.[0]
        this.emitMutation({
            showDropArea: {
                $set:
                    firstItem?.kind === 'file' &&
                    firstItem?.type === 'application/pdf',
            },
        })
    }

    setListRemoteId: EventHandler<'setListRemoteId'> = async ({
        event,
        previousState,
    }) => {
        // Should trigger state update on `newListsState` cache event
        this.options.annotationsCache.updateList({
            unifiedId: event.listId,
            remoteId: event.remoteListId,
        })
    }

    shareList: EventHandler<'shareList'> = async ({ event, previousState }) => {
        const listData = getListData(event.listId, previousState, {
            mustBeLocal: true,
            source: 'shareList',
        })
        const { remoteListId } = await this.options.contentShareBG.shareList({
            localListId: listData.localId!,
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

        // Should trigger state update on `newListsState` cache event
        this.options.annotationsCache.updateList({
            unifiedId: event.listId,
            remoteId: remoteListId,
        })

        this.emitMutation({ searchResults: mutation })
    }

    confirmListEdit: EventHandler<'confirmListEdit'> = async ({
        event,
        previousState,
    }) => {
        const listData = getListData(event.listId, previousState, {
            mustBeLocal: true,
            source: 'confirmListEdit',
        })
        const oldName = listData.name
        const newName = event.value.trim()

        if (newName === oldName) {
            return
        }

        const validationResult = validateSpaceName(
            newName,
            normalizedStateToArray(previousState.listsSidebar.lists)
                .filter((list) => list.localId != null)
                .map((list) => ({ id: list.unifiedId, name: list.name })),
            {
                listIdToSkip: event.listId,
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
                this.options.annotationsCache.updateList({
                    unifiedId: event.listId,
                    name: newName,
                })
                this.emitMutation({
                    listsSidebar: {
                        editListErrorMessage: { $set: null },
                        editingListId: { $set: undefined },
                    },
                })
                await this.options.listsBG.updateListName({
                    id: listData.localId,
                    oldName,
                    newName,
                })
            },
        )
    }

    cancelListEdit: EventHandler<'cancelListEdit'> = async ({}) => {
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
        this.emitMutation({
            listsSidebar: {
                editingListId: { $set: event.listId },
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
            listsSidebar: {
                showMoreMenuListId: { $set: listIdToSet },
                editingListId: { $set: listIdToSet },
            },
        })
    }

    setDeletingListId: EventHandler<'setDeletingListId'> = async ({
        event,
    }) => {
        this.emitMutation({
            modals: { deletingListId: { $set: event.listId } },
            listsSidebar: { showMoreMenuListId: { $set: undefined } },
        })
    }

    updateSelectedListDescription: EventHandler<
        'updateSelectedListDescription'
    > = async ({ event, previousState }) => {
        const { selectedListId } = previousState.listsSidebar
        if (!selectedListId) {
            throw new Error('No selected list ID set to update description')
        }
        const listData = getListData(selectedListId, previousState, {
            mustBeLocal: true,
            source: 'updateSelectedListDescription',
        })

        this.options.annotationsCache.updateList({
            unifiedId: selectedListId,
            description: event.description,
        })

        await this.options.listsBG.updateListDescription({
            description: event.description,
            listId: listData.localId!,
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
        previousState,
    }) => {
        const listId = previousState.modals.deletingListId
        if (!listId) {
            throw new Error('No list ID is set for deletion')
        }
        const listData = getListData(listId, previousState, {
            mustBeLocal: true,
            source: 'confirmListDelete',
        })

        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: { listDeleteState: { $set: taskState } },
            }),
            async () => {
                this.options.annotationsCache.removeList({ unifiedId: listId })
                this.emitMutation({
                    modals: { deletingListId: { $set: undefined } },
                    listsSidebar: {
                        selectedListId: { $set: undefined },
                        filteredListIds: {
                            $apply: (ids: string[]) =>
                                ids.filter((id) => id !== listId),
                        },
                    },
                })
                await this.options.listsBG.removeList({ id: listData.localId! })
            },
        )
    }

    switchToFeed: EventHandler<'switchToFeed'> = async ({ previousState }) => {
        if (!(await this.ensureLoggedIn())) {
            return
        }

        this.emitMutation({
            listsSidebar: {
                showFeed: { $set: true },
                selectedListId: { $set: SPECIAL_LIST_NAMES.FEED },
            },
        })

        if (previousState.listsSidebar.hasFeedActivity) {
            this.emitMutation({
                listsSidebar: {
                    hasFeedActivity: { $set: false },
                },
            })
            await setLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY, false)
            await this.options.activityIndicatorBG.markActivitiesAsSeen()
        }
    }
    /* END - lists sidebar event handlers */

    /* START - sync status menu event handlers */
    setSyncStatusMenuDisplayState: EventHandler<
        'setSyncStatusMenuDisplayState'
    > = async ({ event }) => {
        this.emitMutation({
            syncMenu: { isDisplayed: { $set: !event.isShown } },
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
