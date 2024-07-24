import { UILogic, UIEventHandler, UIMutation } from 'ui-logic-core'
import debounce from 'lodash/debounce'
import type { AnnotationPrivacyState } from '@worldbrain/memex-common/lib/annotations/types'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import * as utils from './search-results/util'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { RootState as State, DashboardDependencies, Events } from './types'
import { formatTimestamp } from '@worldbrain/memex-common/lib/utils/date-time'
import { DATE_PICKER_DATE_FORMAT as FORMAT } from 'src/dashboard-refactor/constants'
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
    getListData,
    getOwnLists,
} from './util'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import type { NoResultsType, SelectableBlock } from './search-results/types'
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
import { setUserContext as setSentryUserContext } from 'src/util/raven'
import { isDuringInstall } from 'src/overview/onboarding/utils'
import type { AnnotationSharingStates } from 'src/content-sharing/background/types'
import { getAnnotationPrivacyState } from '@worldbrain/memex-common/lib/content-sharing/utils'
import { ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY } from 'src/activity-indicator/constants'
import { validateSpaceName } from '@worldbrain/memex-common/lib/utils/space-name-validation'
import { HIGHLIGHT_COLORS_DEFAULT } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/constants'
import { openPDFInViewer } from 'src/pdf/util'
import {
    deriveListOwnershipStatus,
    hydrateCacheForListUsage,
} from 'src/annotations/cache/utils'
import type { PageAnnotationsCacheEvents } from 'src/annotations/cache/types'
import { SPECIAL_LIST_STRING_IDS } from './lists-sidebar/constants'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import {
    clearBulkEditItems,
    getBulkEditItems,
    setBulkEdit,
} from 'src/bulk-edit/utils'
import type { DragPageToListAction } from './lists-sidebar/types'
import { defaultOrderableSorter } from '@worldbrain/memex-common/lib/utils/item-ordering'
import MarkdownIt from 'markdown-it'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { captureException } from 'src/util/raven'
import analytics from 'src/analytics'
import { processCommentForImageUpload } from '@worldbrain/memex-common/lib/annotations/processCommentForImageUpload'
import type { UnifiedSearchResult } from 'src/search/background/types'
import type { BulkEditCollection } from 'src/bulk-edit/types'
import checkBrowser from 'src/util/check-browser'
import { getVisibleTreeNodesInOrder } from 'src/custom-lists/ui/list-trees/util'
import type { State as ListTreesState } from 'src/custom-lists/ui/list-trees/types'
import type { ListTrees } from 'src/custom-lists/ui/list-trees'

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

const md = new MarkdownIt()

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
        | 'contentSharing'
        | 'dashboard'
        | 'extension'
        | 'activityIndicator'
        | 'highlightColors'
    >
    currentSearchID = 0
    observer: MutationObserver // This line explicitly declares the observer property for clarity.

    constructor(
        private options: DashboardDependencies & {
            /** Allows direct access to list tree state encapsulated in ListTrees container component. */
            getListTreesRef: () => ListTrees | undefined
        },
    ) {
        super()
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: options.syncSettingsBG,
        })
        window['__annotationsCache'] = options.annotationsCache
    }

    private setupRemoteEventListeners() {
        this.personalCloudEvents = getRemoteEventEmitter('personalCloud')
        this.personalCloudEvents.on('cloudStatsUpdated', async ({ stats }) => {
            this.emitMutation({
                syncMenu: {
                    pendingLocalChangeCount: {
                        $set: stats.pendingUploads ?? null,
                    },
                    // TODO: re-implement pending download count
                    pendingRemoteChangeCount: {
                        $set: stats.pendingDownloads ?? null,
                    },
                },
            })

            if (stats.pendingDownloads === 0 && stats.pendingUploads === 0) {
                const dateNow = Date.now()
                this.emitMutation({
                    syncMenu: {
                        lastSuccessfulSyncDate: {
                            $set: new Date(dateNow),
                        },
                    },
                })
            }
        })

        this.personalCloudEvents.on('downloadStarted', () => {
            // this.emitMutation({
            //     syncMenu: { pendingRemoteChangeCount: { $set: 1 } },
            // })
            this.toggleSyncDownloadActive()
        })
        // this.personalCloudEvents.on('downloadStopped', () => {
        //     this.emitMutation({
        //         syncMenu: { pendingRemoteChangeCount: { $set: 0 } },
        //     })
        // })
        // this.personalCloudEvents.on(
        //     'downloadStarted',
        //     this.toggleSyncDownloadActive,
        // )
        // this.personalCloudEvents.on(
        //     'downloadStopped',
        //     this.toggleSyncDownloadActive,
        // )
    }

    getInitialState(): State {
        const urlSearchParams = this.getURLSearchParams()
        const searchQuery = urlSearchParams.get('query')
        const spacesQuery = urlSearchParams.get('spaces')
        const selectedSpaceQuery = urlSearchParams.get('selectedSpace')
        const fromQuery = urlSearchParams.get('from')
        const from = formatTimestamp(parseFloat(fromQuery), FORMAT)
        const toQuery = urlSearchParams.get('to')

        const to = formatTimestamp(parseFloat(toQuery), FORMAT)

        let spacesArray = []
        let spacesArrayString
        let selectedSpace = parseFloat(selectedSpaceQuery)

        if (spacesQuery && spacesQuery.includes(',')) {
            spacesArrayString = spacesQuery && spacesQuery.split(',')
            spacesArray = spacesArrayString?.map((item) => Number(item))
        } else if (spacesQuery) {
            spacesArray.push(parseFloat(spacesQuery))
        }

        let openFilterBarOnLoad: boolean
        if ((spacesQuery && spacesArray.length > 1) || fromQuery || toQuery) {
            openFilterBarOnLoad = true
        } else {
            openFilterBarOnLoad = false
        }

        return {
            currentUser: {
                id: '',
                displayName: '',
                email: '',
                emailVerified: false,
            },
            loadState: 'pristine',
            mode: isDuringInstall(this.options.location)
                ? 'onboarding'
                : 'search',
            showDropArea: this.options.location.href.includes(
                MISSING_PDF_QUERY_PARAM,
            ),
            showAllNotes: true,
            themeVariant: null,
            bulkSelectedUrls: null,
            bulkDeleteLoadingState: 'pristine',
            bulkEditSpacesLoadingState: 'pristine',
            modals: {
                showLogin: false,
                showSubscription: false,
                showDisplayNameSetup: false,
                showNoteShareOnboarding: false,
                confirmPrivatizeNoteArgs: null,
                confirmSelectNoteSpaceArgs: null,
            },
            spaceSearchSuggestions: [],
            searchResults: {
                blankSearchOldestResultTimestamp: null,
                results: {},
                pageIdToResultIds: {},
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
                uploadedPdfLinkLoadState: 'pristine',
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
                searchFiltersOpen: false,
                spacesIncluded: [],
                tagsExcluded: [],
                tagsIncluded: [],
                dateFromInput: fromQuery ? from : null,
                dateToInput: toQuery ? to : null,
                limit: PAGE_SIZE,
                skip: 0,
            },
            listsSidebar: {
                spaceSidebarWidth: sizeConstants.listsSidebar.width + 'px',
                addListErrorMessage: null,
                editListErrorMessage: null,
                focusedListId: null,
                listShareLoadingState: 'pristine',
                listDropReceiveState: 'pristine',
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
                themeVariant: null,
                disableMouseLeave: false,
            },
            syncMenu: {
                isDisplayed: false,
                pendingLocalChangeCount: null,
                pendingRemoteChangeCount: null,
                lastSuccessfulSyncDate: null,
            },
            highlightColors: null,
            isNoteSidebarShown: null,
            showFullScreen: null,
            blurEffectReset: false,
            focusLockUntilMouseStart: false,
            selectableBlocks: [],
            focusedBlockId: -1,
            imageSourceForPreview: null,
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const { annotationsCache, authBG } = this.options
        this.setupRemoteEventListeners()
        const searchParams = this.getURLSearchParams()
        const spacesQuery = searchParams.get('spaces')
        const selectedSpaceQuery = searchParams.get('selectedSpace')
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        let spacesArray: number[] = []
        let spacesArrayString: string[]
        let selectedSpace = parseFloat(selectedSpaceQuery)

        if (spacesQuery && spacesQuery.includes(',')) {
            spacesArrayString = spacesQuery && spacesQuery.split(',')
            spacesArray = spacesArrayString?.map((item) => Number(item))
        } else if (spacesQuery) {
            spacesArray.push(parseFloat(spacesQuery))
        }

        let shouldOpenFilterbar =
            spacesArray.length > 0 || (from && from.length) || (to && to.length)
                ? true
                : false

        annotationsCache.events.addListener(
            'newAnnotationsState',
            this.cacheAnnotationsSubscription,
        )
        annotationsCache.events.addListener(
            'newListsState',
            this.cacheListsSubscription,
        )

        const syncSettings = createSyncSettingsStore<'highlightColors'>({
            syncSettingsBG: this.options.syncSettingsBG,
        })

        const highlightColorSettings = await syncSettings.highlightColors.get(
            'highlightColors',
        )

        this.emitMutation({
            highlightColors: { $set: highlightColorSettings },
        })

        await loadInitial(this, async () => {
            if (this.options.inPageMode) {
                this.observeBlurContainer()
            }
            await this.initThemeVariant()
            const user = await authBG.getCurrentUser()
            setSentryUserContext(user)
            this.emitMutation({
                currentUser: { $set: user },
            })
            await executeUITask(
                this,
                (taskState) => ({
                    listsSidebar: { listLoadState: { $set: taskState } },
                }),
                async () => {
                    await hydrateCacheForListUsage({
                        cache: annotationsCache,
                        user: user
                            ? { type: 'user-reference', id: user.id }
                            : undefined,
                        bgModules: {
                            bgScript: this.options.bgScriptBG,
                            customLists: this.options.listsBG,
                            contentSharing: this.options.contentShareBG,
                            pageActivityIndicator: this.options
                                .pageActivityIndicatorBG,
                        },
                    })
                },
            )

            let nextState = await this.loadAuthStates(previousState)
            nextState = await this.hydrateStateFromLocalStorage(nextState)
            if (
                spacesArray.length > 0 ||
                selectedSpace ||
                (from && from.length) ||
                (to && to.length)
            ) {
                let selectedListId
                selectedListId = selectedSpace
                    ? this.options.annotationsCache.getListByLocalId(
                          selectedSpace,
                      )?.unifiedId ?? null
                    : null
                this.mutateAndTriggerSearch(previousState, {
                    listsSidebar: { selectedListId: { $set: selectedListId } },
                    searchFilters: {
                        dateFrom: { $set: from ? parseFloat(from) : undefined },
                        dateTo: { $set: to ? parseFloat(to) : undefined },
                        spacesIncluded: {
                            $set: spacesArray.length > 0 ? spacesArray : [],
                        },
                        searchFiltersOpen: { $set: shouldOpenFilterbar },
                    },
                })
            } else {
                await this.runSearch({ previousState: nextState, event: null })
            }

            await this.getFeedActivityStatus()
            await this.getInboxUnreadCount()
            await this.getDownloadStats()
            if (user) {
                this.processUIEvent('syncNow', {
                    previousState,
                    event: { preventUpdateStats: true },
                })
            }

            const bulkSelectedItems = (await getBulkEditItems()) ?? {}

            for (const [url, item] of Object.entries(bulkSelectedItems)) {
                bulkSelectedItems[url] = {
                    type: item.type,
                }
                // You can modify the object here if needed
            }

            this.emitMutation({
                bulkSelectedUrls: { $set: bulkSelectedItems },
            })
        })
    }

    componentWillUnmount() {
        if (this.observer) {
            this.observer.disconnect()
        }
    }

    // NOTE: This debounce exists as sync DL documents come in 1-by-1, often with short delays between each doc, which
    //  resulted in the status indicator constantly toggling on and off as docs came in. Leading to flickering when
    //  many docs were queued up.
    //  A rough test got me delays of 1-8s between docs created at roughly the same time, which is why the 8s wait was chosen.

    private downloadStoppedTimeout: any | null = null

    getDownloadStats = async () => {
        const pendingDownloads = await this.options.personalCloudBG.countPendingSyncDownloads()
        this.emitMutation({
            syncMenu: {
                pendingRemoteChangeCount: { $set: pendingDownloads },
            },
        })
        if (pendingDownloads === 0) {
            const dateNow = Date.now()
            this.emitMutation({
                syncMenu: {
                    lastSuccessfulSyncDate: {
                        $set: new Date(dateNow),
                    },
                },
            })
        }
    }

    private toggleSyncDownloadActive = () => {
        // Clear any existing timeout to reset the debounce timer
        if (this.downloadStoppedTimeout) {
            clearTimeout(this.downloadStoppedTimeout)
        }

        // Set a new timeout to wait for 8 seconds before emitting downloadStopped
        this.downloadStoppedTimeout = setTimeout(() => {
            this.emitMutation({
                syncMenu: {
                    pendingRemoteChangeCount: {
                        $set: 0,
                    },
                },
            })
        }, 8000) // 8000 milliseconds = 8 seconds
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
        if (this.islikelyInPage) {
            return
        }
        let updatedUrl: string
        // Get the current URL of the page

        const url = this.options.location.href

        let regex = new RegExp(`(${key}=)[^&]+`)
        let match = url.match(regex)

        if (!match) {
            regex = new RegExp(`(${key}=)`)
            match = url.match(regex)
        }

        if (value === null || value?.length === 0) {
            // updatedParam = ''
            this.removeQueryString(key)
            return
        }

        updatedUrl = url
        if (match) {
            // update the query parameter value
            let updatedParam: string

            updatedParam = `${key}=${value}`
            updatedUrl = url.replace(match[0], updatedParam)
            // replace the old query parameter with the updated one
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

    private cacheListsSubscription: PageAnnotationsCacheEvents['newListsState'] = (
        nextLists,
    ) => {
        this.emitMutation({ listsSidebar: { lists: { $set: nextLists } } })
    }

    private cacheAnnotationsSubscription: PageAnnotationsCacheEvents['newAnnotationsState'] = (
        nextAnnotations,
    ) => {}

    observeBlurContainer() {
        const container = document.getElementById('BlurContainer')

        if (!container) return
        const config = { attributes: true, attributeFilter: ['style'] }
        this.observer = new MutationObserver((mutationsList, observer) => {
            mutationsList.forEach((mutation) => {
                if ((mutation.target as HTMLElement).id === 'BlurContainer') {
                    this.ensureBlurEffect(container)
                }
            })
        })

        this.observer.observe(container, config)
        this.setupResizeListener()
    }

    setupResizeListener() {
        window.addEventListener('resize', this.handleWindowResize)
    }

    handleWindowResize = () => {
        const container = document.getElementById('BlurContainer')
        if (container) {
            this.ensureBlurEffect(container)
        }
    }

    increment = 0

    ensureBlurEffect(container: HTMLElement) {
        this.increment++
        if (
            // @ts-ignore
            !container.style.backdropFilter ||
            // @ts-ignore
            container.style.backdropFilter !== 'blur(10px)'
        ) {
            if (this.increment > 1) {
                const blurContainer = document.getElementById('BlurContainer')
                blurContainer.style.background = this.options.theme.colors.black
            } else {
                this.emitMutation({
                    blurEffectReset: { $set: true },
                })

                setTimeout(() => {
                    this.emitMutation({
                        blurEffectReset: { $set: false },
                    })
                    setTimeout(() => {
                        const blurContainer = document.getElementById(
                            'BlurContainer',
                        )
                        blurContainer.style.background = this.options.theme.colors.black
                        if (
                            // @ts-ignore
                            !blurContainer.style.backdropFilter ||
                            // @ts-ignore
                            blurContainer.style.backdropFilter !== 'blur(10px)'
                        ) {
                            // @ts-ignore
                            blurContainer.style.backdropFilter = 'blur(10px)'
                            blurContainer.style.background = '#313239'
                        }
                    }, 50)
                }, 100)
            }
        }
    }

    cleanupBlurObserver() {
        if (this.observer) {
            this.observer.disconnect()
        }
        window.removeEventListener('resize', this.handleWindowResize)
    }

    async initThemeVariant() {
        const variantStorage = await this.options.localStorage.get(
            'themeVariant',
        )
        const variant = variantStorage['themeVariant'] ?? 'dark'
        this.emitMutation({ themeVariant: { $set: variant } })
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

    // TODO: Make better to check for in -page pro
    islikelyInPage = this.options.location.href.startsWith('http')

    /* START - Misc helper methods */
    private async hydrateStateFromLocalStorage(
        previousState: State,
    ): Promise<State> {
        const { localStorage } = this.options
        const {
            [CLOUD_STORAGE_KEYS.lastSyncDownload]: lastSyncDownload,
            [CLOUD_STORAGE_KEYS.lastSyncUpload]: lastSyncUpload,
            [STORAGE_KEYS.mobileAdSeen]: mobileAdSeen,
        } = await localStorage.get([
            CLOUD_STORAGE_KEYS.lastSyncDownload,
            CLOUD_STORAGE_KEYS.lastSyncUpload,
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

        const lastSyncTime: number =
            lastSyncDownload > lastSyncUpload
                ? lastSyncDownload
                : lastSyncUpload ?? null

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
                isSidebarLocked: {
                    $set: this.islikelyInPage
                        ? false
                        : listsSidebarLocked ?? true,
                },
            },
            syncMenu: {
                lastSuccessfulSyncDate: { $set: new Date(lastSyncTime) },
            },
        }
        this.emitMutation(mutation)
        return this.withMutation(previousState, mutation)
    }

    private async getFeedActivityStatus() {
        const hasActivityStored = await this.syncSettings.activityIndicator.get(
            'feedHasActivity',
        )

        if (hasActivityStored === true) {
            this.emitMutation({
                listsSidebar: {
                    hasFeedActivity: { $set: true },
                },
            })
        } else {
            const activityStatus = await this.options.activityIndicatorBG.checkActivityStatus()
            const hasFeedActivity = activityStatus === 'has-unseen'
            await this.options.localStorage.set({
                [ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY]: hasFeedActivity,
            })
            this.emitMutation({
                listsSidebar: { hasFeedActivity: { $set: hasFeedActivity } },
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
    setDisableMouseLeave: EventHandler<'setDisableMouseLeave'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            listsSidebar: {
                disableMouseLeave: { $set: event.disable },
            },
        })
    }

    openImageInPreview: EventHandler<'openImageInPreview'> = async ({
        event,
    }) => {
        this.emitMutation({
            imageSourceForPreview: { $set: event },
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
            },
        }

        this.emitMutation(mutation)
        const nextState = this.withMutation(previousState, mutation)
        this.runSearch({ previousState: nextState, event: null })
    }

    // TODO: bulk edit implementation needs simplification
    selectAllCurrentItems: EventHandler<'selectAllCurrentItems'> = async ({
        previousState,
        event,
    }) => {
        const pageSize = 10
        let skip = 0
        let nextState = previousState
        const selectedUrls = previousState.bulkSelectedUrls
        const bulkEditItems: BulkEditCollection = await getBulkEditItems()
        let result: UnifiedSearchResult

        // Page through entire set of search results with current filters, keeping track of URLs and titles
        do {
            nextState = this.withMutation(nextState, {
                searchFilters: {
                    skip: { $set: skip },
                    limit: { $set: pageSize },
                    dateTo: { $set: null },
                },
                searchResults: {
                    blankSearchOldestResultTimestamp: {
                        $set: result?.oldestResultTimestamp ?? Date.now(),
                    },
                },
            })

            const params = stateToSearchParams(
                nextState,
                this.options.annotationsCache,
            )

            result = await this.options.searchBG.unifiedSearch(params)

            const { results } = utils.pageSearchResultToState(
                result,
                params,
                this.options.annotationsCache,
                previousState.showAllNotes,
            )

            const resultsList = results[-1].pages.byId

            for (const page of Object.values(resultsList)) {
                const annotations = page.noteIds.user ?? []
                if (selectedUrls[page.pageId]) {
                    if (annotations.length > 0) {
                        for (let note of annotations) {
                            bulkEditItems[note] = {
                                type: 'note',
                            }
                        }
                    }
                    continue
                } else {
                    bulkEditItems[page.pageId] = {
                        type: 'page',
                    }
                    if (annotations.length > 0) {
                        for (let note of annotations) {
                            bulkEditItems[note] = {
                                type: 'note',
                            }
                        }
                    }
                }
            }

            skip += pageSize
        } while (!result.resultsExhausted)

        this.emitMutation({ bulkSelectedUrls: { $set: bulkEditItems } })
        await setBulkEdit(bulkEditItems, false)
    }

    clearBulkSelection: EventHandler<'clearBulkSelection'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            bulkSelectedUrls: { $set: {} },
        })
        await clearBulkEditItems()
    }
    setFocusLock: EventHandler<'setFocusLock'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            focusLockUntilMouseStart: { $set: event },
        })
    }

    changeFocusItem: EventHandler<'changeFocusItem'> = async ({
        previousState,
        event,
    }) => {
        const selectedBlocksArray: SelectableBlock[] =
            previousState.selectableBlocks

        const currentFocusElementIndex = previousState.focusedBlockId
        const currentFocusIndex = currentFocusElementIndex

        let previousItem
        let nextItem

        if (currentFocusIndex !== -1) {
            previousItem = selectedBlocksArray[currentFocusIndex]
        }

        if (event.direction === 'up') {
            if (currentFocusIndex === -1) {
                const searchBarElement = document.getElementById('search-bar')
                if (searchBarElement) {
                    searchBarElement.focus()
                }
                return
            }
            const searchBarElement = document.getElementById('search-bar')
            if (searchBarElement) {
                searchBarElement.blur()
            }
            nextItem = selectedBlocksArray[currentFocusIndex - 1]
            this.emitMutation({
                focusedBlockId: { $set: currentFocusIndex - 1 },
            })
        }
        if (event.direction === 'down') {
            const searchBarElement = document.getElementById('search-bar')
            if (searchBarElement) {
                searchBarElement.blur()
            }

            if (currentFocusIndex === selectedBlocksArray.length - 1) {
                return
            }
            nextItem = selectedBlocksArray[currentFocusIndex + 1]
            this.emitMutation({
                focusedBlockId: { $set: currentFocusIndex + 1 },
            })
        }
        if (event.item?.id != null) {
            const searchBarElement = document.getElementById('search-bar')
            if (searchBarElement) {
                searchBarElement.blur()
            }
            const itemPos = event.item?.id?.split('-')[0]
            if (parseFloat(itemPos) === currentFocusElementIndex) {
                return
            }
            const itemId = event.item.id?.replace(/^[^-]*-/, '')
            const nextFocusItemIndex = selectedBlocksArray.findIndex(
                (item) => item?.id === itemId,
            )

            nextItem = selectedBlocksArray[nextFocusItemIndex]
            this.emitMutation({
                focusedBlockId: { $set: nextFocusItemIndex },
            })
        }

        if (
            event.item?.id == null &&
            event.direction == undefined &&
            event.item?.type == null
        ) {
            this.emitMutation({
                focusedBlockId: { $set: null },
            })
        }

        if (nextItem) {
            if (nextItem.type === 'page') {
                this.emitMutation({
                    searchResults: {
                        pageData: {
                            byId: {
                                [nextItem?.id]: {
                                    isInFocus: { $set: true },
                                },
                            },
                        },
                    },
                })
            }
            if (nextItem.type === 'note') {
                this.emitMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [nextItem?.id]: {
                                    isInFocus: { $set: true },
                                },
                            },
                        },
                    },
                })
            }
        }

        if (previousItem) {
            if (previousItem.type === 'note') {
                this.emitMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [previousItem?.id]: {
                                    isInFocus: { $set: false },
                                },
                            },
                        },
                    },
                })
            }
            if (previousItem.type === 'page') {
                this.emitMutation({
                    searchResults: {
                        pageData: {
                            byId: {
                                [previousItem?.id]: {
                                    isInFocus: { $set: false },
                                },
                            },
                        },
                    },
                })
            }
        }
    }

    setBulkEditSpace: EventHandler<'setBulkEditSpace'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            bulkEditSpacesLoadingState: { $set: 'running' },
        })

        const selectedItems: BulkEditCollection = await getBulkEditItems()
        const unifiedListId = this.options.annotationsCache.getListByLocalId(
            event.listId,
        )

        for (let [url, item] of Object.entries(selectedItems)) {
            if (item.type === 'page') {
                await this.options.listsBG.updateListForPage({
                    url: 'https://' + url,
                    added: event.listId,
                    skipPageIndexing: true,
                })
                const calcNextLists = updatePickerValues({
                    added: unifiedListId.unifiedId,
                })

                const newPageLists =
                    previousState.searchResults.pageData.byId[url]?.lists ?? []

                newPageLists.push(unifiedListId.unifiedId)
                let nextPageListIds = null
                if (newPageLists.length > 0) {
                    nextPageListIds =
                        calcNextLists(
                            previousState.searchResults.pageData.byId[url]
                                ?.lists,
                        ) ?? []
                }

                this.options.annotationsCache.setPageData(url, nextPageListIds)

                this.emitMutation({
                    searchResults: {
                        pageData: {
                            byId: {
                                [url]: {
                                    lists: { $set: nextPageListIds },
                                },
                            },
                        },
                    },
                })
            }
            if (item.type === 'note') {
                await this.processUIEvent('setNoteLists', {
                    previousState,
                    event: { noteId: url, added: unifiedListId.unifiedId },
                })
            }
        }

        this.emitMutation({
            bulkEditSpacesLoadingState: { $set: 'pristine' },
        })

        // await this.options.listsBG.updateListForPage({
        //     url: event.fullPageUrl,
        //     added: event.added && listData.localId,
        //     deleted: event.deleted && listData.localId,
        //     skipPageIndexing: true,
        // })
    }

    // leaving this here for now in order to finalise the feature for handling the race condition rendering

    /* END - Misc helper methods */

    /* START - Misc event handlers */
    search: EventHandler<'search'> = async ({ previousState, event }) => {
        const searchID = ++this.currentSearchID
        // Some states should be reset if not paginating a previously run search
        const mutation: UIMutation<State> = {
            searchResults: {
                blankSearchOldestResultTimestamp: {
                    $apply: (timestamp) => (event?.paginate ? timestamp : null),
                },
            },
            searchFilters: {
                skip: {
                    $apply: (skip) => (event?.paginate ? skip + PAGE_SIZE : 0),
                },
            },
        }

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: {
                    [event?.paginate
                        ? 'searchPaginationState'
                        : 'searchState']: {
                        $set: taskState,
                    },
                },
            }),

            async () => {
                if (searchID !== this.currentSearchID) {
                    return
                } else {
                    const searchState = this.withMutation(
                        previousState,
                        mutation,
                    )
                    const params = stateToSearchParams(
                        searchState,
                        this.options.annotationsCache,
                    )
                    const result = await this.options.searchBG.unifiedSearch(
                        params,
                    )

                    const {
                        noteData,
                        pageData,
                        results,
                        pageIdToResultIds,
                    } = utils.pageSearchResultToState(
                        result,
                        params,
                        this.options.annotationsCache,
                        previousState.showAllNotes,
                    )

                    let noResultsType: NoResultsType = null
                    if (
                        result.resultsExhausted &&
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
                            noResultsType = 'no-results'
                        }
                    }

                    if (searchID !== this.currentSearchID) {
                        return
                    }

                    // Merge page ID -> result IDs indices, if we're paginating
                    let nextPageIdToResultIds: State['searchResults']['pageIdToResultIds'] = {}
                    if (event?.paginate) {
                        const allPageIds = new Set([
                            ...Object.keys(pageIdToResultIds),
                            ...Object.keys(
                                previousState.searchResults.pageIdToResultIds,
                            ),
                        ])
                        for (const pageId of allPageIds) {
                            const next = pageIdToResultIds[pageId] ?? []
                            const prev =
                                previousState.searchResults.pageIdToResultIds[
                                    pageId
                                ] ?? []
                            nextPageIdToResultIds[pageId] = [
                                ...new Set([...prev, ...next]),
                            ]
                        }
                    } else {
                        nextPageIdToResultIds = pageIdToResultIds
                    }

                    this.emitMutation({
                        searchFilters: mutation.searchFilters,
                        searchResults: {
                            blankSearchOldestResultTimestamp: {
                                $set: result.oldestResultTimestamp,
                            },
                            areResultsExhausted: {
                                $set: result.resultsExhausted,
                            },
                            searchState: { $set: 'success' },
                            searchPaginationState: { $set: 'success' },
                            noResultsType: { $set: noResultsType },
                            pageIdToResultIds: { $set: nextPageIdToResultIds },
                            ...(event?.paginate
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

                    let compiledSelectableBlocks = []

                    if (event?.paginate) {
                        compiledSelectableBlocks =
                            previousState.selectableBlocks
                    }
                    const resultsList = results[-1].pages.byId

                    for (const page of Object.values(resultsList)) {
                        const block: SelectableBlock = {
                            id: page.pageId,
                            type: 'page',
                        }

                        compiledSelectableBlocks.push(block)
                        const pageNotes = page.noteIds.user ?? null

                        if (pageNotes.length > 0) {
                            for (const note of pageNotes) {
                                const noteBlock: SelectableBlock = {
                                    id: note,
                                    type: 'note',
                                }
                                compiledSelectableBlocks.push(noteBlock)
                            }
                        }
                    }
                    this.emitMutation({
                        selectableBlocks: { $set: compiledSelectableBlocks },
                    })
                }
            },
        )
    }

    private runSearch = debounce(this.search, 400)

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

    setShowLoginModal: EventHandler<'setShowLoginModal'> = async ({
        event,
    }) => {
        const isNotFirefox = checkBrowser() !== 'firefox'

        if (isNotFirefox) {
            const isStaging = process.env.NODE_ENV === 'development'

            let url = ''

            if (isStaging) {
                url = 'https://staging.memex.social/auth'
            } else {
                url = 'https://memex.social/auth'
            }

            window.open(url, '_blank')
        } else {
            this.emitMutation({
                modals: {
                    showLogin: { $set: event.isShown },
                },
            })
        }
    }
    syncNow: EventHandler<'syncNow'> = async ({ event }) => {
        this.emitMutation({
            syncMenu: {
                pendingLocalChangeCount: { $set: null },
                pendingRemoteChangeCount: { $set: null },
            },
        })
        if (!event.preventUpdateStats) {
            await this.getDownloadStats()
        }
        this.options.personalCloudBG.invokeSyncDownload()
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

    getHighlightColorSettings: EventHandler<
        'getHighlightColorSettings'
    > = async ({ event, previousState }) => {
        let highlightColors = previousState.highlightColors
        if (!highlightColors) {
            highlightColors = await this.syncSettings.highlightColors.get(
                'highlightColors',
            )
            if (!highlightColors) {
                highlightColors = [...HIGHLIGHT_COLORS_DEFAULT]
            }
        }

        this.emitMutation({ highlightColors: { $set: highlightColors } })
    }

    saveHighlightColor: EventHandler<'saveHighlightColor'> = async ({
        event,
        previousState,
    }) => {
        const colorToUpdate = event.color
        const { ...existing } = previousState.searchResults.noteData.byId[
            event.noteId
        ]

        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { noteUpdateState: { $set: taskState } },
            }),
            async () => {
                // If the main save button was pressed, then we're not changing any share state, thus keep the old lists
                // NOTE: this distinction exists because of the SAS state being implicit and the logic otherwise thinking you want
                //  to make a SAS annotation private protected upon save btn press

                this.emitMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [event.noteId]: {
                                    comment: { $set: existing.comment },
                                    color: { $set: colorToUpdate },
                                },
                            },
                        },
                    },
                    modals: {
                        confirmPrivatizeNoteArgs: { $set: null },
                    },
                })

                const unifiedListIds = new Set(existing.lists)

                // this.options.annotationsCache.updateAnnotation({
                //     comment: existing.comment,
                //     color: colorToUpdate ?? existing.color,
                //     unifiedId: event.unifiedId,
                //     unifiedListIds: existing.unifiedListIds ?? [],
                //     privacyLevel: existing.privacyLevel ?? 0,
                // })

                await updateAnnotation({
                    annotationData: {
                        localId: event.noteId,
                        comment: existing.comment,
                        color: colorToUpdate ?? existing.color,
                        body: existing.highlight,
                    },
                    annotationsBG: this.options.annotationsBG,
                    contentSharingBG: this.options.contentShareBG,
                })
            },
        )
    }
    /* END - modal event handlers */

    /* START - search result event handlers */
    // TODO: Remove this event
    setPageSearchResult: EventHandler<'setPageSearchResult'> = ({
        event,
        previousState,
    }) => {
        const state = utils.pageSearchResultToState(
            event.result,
            { skip: 0, limit: 10 },
            this.options.annotationsCache,
            previousState.showAllNotes,
        )
        this.emitMutation({
            searchResults: {
                results: { $set: state.results },
                pageData: { $set: state.pageData },
                noteData: { $set: state.noteData },
            },
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
        const calcNextLists = updatePickerValues(event)

        const pageResult =
            previousState.searchResults.results[-1].pages.byId[
                event.pageResultId
            ]
        const pageData =
            previousState.searchResults.pageData.byId[pageResult.pageId]

        // If we're removing a shared list, we also need to make sure it gets removed from children annots
        if (removingSharedList) {
            const dependentNoteIds: string[] = []
            const pageResultIds =
                previousState.searchResults.pageIdToResultIds[pageResult.pageId]

            for (const pageResultId of pageResultIds) {
                const noteIdsForPage =
                    previousState.searchResults.results[-1].pages.byId[
                        pageResultId
                    ].noteIds.user

                dependentNoteIds.push(
                    ...noteIdsForPage.filter(
                        (noteId) =>
                            previousState.searchResults.noteData.byId[noteId]
                                .isBulkShareProtected,
                    ),
                )
            }

            for (const noteId of dependentNoteIds) {
                noteDataMutation[noteId] = {
                    lists: { $apply: calcNextLists },
                }
            }
        }

        const nextPageListIds = calcNextLists(
            previousState.searchResults.pageData.byId[pageResult.pageId].lists,
        )
        this.options.annotationsCache.setPageData(
            pageResult.pageId,
            nextPageListIds,
        )
        this.emitMutation({
            searchResults: {
                noteData: { byId: noteDataMutation },
                pageData: {
                    byId: {
                        [pageResult.pageId]: {
                            lists: { $set: nextPageListIds },
                        },
                    },
                },
            },
        })

        await this.options.listsBG.updateListForPage({
            url: pageData.fullUrl,
            added: event.added && listData.localId,
            deleted: event.deleted && listData.localId,
            skipPageIndexing: true,
        })
    }

    setDeletingPageArgs: EventHandler<'setDeletingPageArgs'> = async ({
        event,
        previousState,
    }) => {
        if (event.instaDelete) {
            const pageLists =
                previousState.searchResults.pageData.byId[event.pageResultId]
                    .lists
            const isPageInInbox = pageLists.some(
                (listId) =>
                    this.options.annotationsCache.lists.byId[listId].localId ===
                    SPECIAL_LIST_IDS.INBOX,
            )

            if (isPageInInbox) {
                this.emitMutation({
                    listsSidebar: {
                        inboxUnreadCount: { $apply: (count) => count - 1 },
                    },
                })
            }
            await executeUITask(
                this,
                (taskState) => ({
                    searchResults: { pageDeleteState: { $set: taskState } },
                }),
                async () => {
                    const resultsMutation: UIMutation<
                        State['searchResults']
                    > = {
                        pageData: {
                            byId: { $unset: [event.pageResultId] },
                            allIds: {
                                $set: previousState.searchResults.pageData.allIds.filter(
                                    (id) => id !== event.pageResultId,
                                ),
                            },
                        },
                    }

                    if (event.day === PAGE_SEARCH_DUMMY_DAY) {
                        resultsMutation.results = {
                            [event.day]: {
                                pages: {
                                    byId: { $unset: [event.pageResultId] },
                                    allIds: {
                                        $set: previousState.searchResults.results[
                                            event.day
                                        ].pages.allIds.filter(
                                            (id) => id !== event.pageResultId,
                                        ),
                                    },
                                },
                            },
                        }
                    } else {
                        resultsMutation.results = removeAllResultOccurrencesOfPage(
                            previousState.searchResults.results,
                            event.pageResultId,
                        )
                    }

                    this.emitMutation({
                        searchResults: resultsMutation,
                    })
                    await this.options.searchBG.delPages([event.pageResultId])
                },
            )
        } else {
            this.emitMutation({
                modals: { deletingPageArgs: { $set: event } },
            })
        }
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
        this.processUIEvent('changeFocusItem', {
            previousState,
            event: {
                direction: 'down',
                item: { id: event.pageResultId, type: 'page' },
            },
        })

        let listData = getListData(
            previousState.listsSidebar.selectedListId,
            previousState,
            { mustBeLocal: true, source: 'removePageFromList' },
        )
        let resultItem =
            previousState.searchResults.results[event.day]?.pages.byId[
                event.pageResultId
            ]
        if (!resultItem) {
            throw new Error(
                `Page to remove from list not found in UI results state: ${event.pageResultId}`,
            )
        }

        let mutation: UIMutation<State['searchResults']> = {}

        if (event.day === PAGE_SEARCH_DUMMY_DAY) {
            mutation.results = {
                [PAGE_SEARCH_DUMMY_DAY]: {
                    pages: {
                        byId: { $unset: [event.pageResultId] },
                        allIds: {
                            $apply: (ids: string[]) =>
                                ids.filter((id) => id !== event.pageResultId),
                        },
                    },
                },
            }
        } else {
            mutation.results = removeAllResultOccurrencesOfPage(
                previousState.searchResults.results,
                event.pageResultId,
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
            url: resultItem.pageId,
        })
    }

    clearInbox: EventHandler<'clearInbox'> = async () => {
        this.emitMutation({
            loadState: { $set: 'running' },
            listsSidebar: {
                inboxUnreadCount: { $set: 0 },
            },
        })
        await this.options.listsBG.removeAllListPages(SPECIAL_LIST_IDS.INBOX)
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

        this.emitMutation({
            searchResults: {
                clearInboxLoadState: { $set: 'pristine' },
            },
            loadState: { $set: 'pristine' },
        })
    }

    cancelPageDelete: EventHandler<'cancelPageDelete'> = async ({}) => {
        this.emitMutation({
            modals: { deletingPageArgs: { $set: undefined } },
        })
    }

    confirmPageDelete: EventHandler<'confirmPageDelete'> = async ({
        previousState: { searchResults, modals },
    }) => {
        if (!modals.deletingPageArgs) {
            throw new Error('No page ID is set for deletion')
        }

        const { pageResultId, day } = modals.deletingPageArgs

        const pageResult = searchResults.results[-1].pages.byId[pageResultId]
        const pageData = searchResults.pageData.byId[pageResult.pageId]
        const isPageInInbox = pageData.lists.some(
            (listId) =>
                this.options.annotationsCache.lists.byId[listId].localId ===
                SPECIAL_LIST_IDS.INBOX,
        )

        if (isPageInInbox) {
            this.emitMutation({
                listsSidebar: {
                    inboxUnreadCount: { $apply: (count) => count - 1 },
                },
            })
        }
        await executeUITask(
            this,
            (taskState) => ({
                searchResults: { pageDeleteState: { $set: taskState } },
            }),
            async () => {
                const resultsMutation: UIMutation<State['searchResults']> = {
                    pageData: {
                        byId: { $unset: [pageResult.pageId] },
                        allIds: {
                            $set: searchResults.pageData.allIds.filter(
                                (id) => id !== pageResult.pageId,
                            ),
                        },
                    },
                }

                const pageResultIds =
                    searchResults.pageIdToResultIds[pageResult.pageId]

                if (day === PAGE_SEARCH_DUMMY_DAY) {
                    resultsMutation.results = {
                        [day]: {
                            pages: {
                                byId: { $unset: pageResultIds },
                                allIds: {
                                    $set: searchResults.results[
                                        day
                                    ].pages.allIds.filter(
                                        (id) => !pageResultIds.includes(id),
                                    ),
                                },
                            },
                        },
                    }
                    // TODO: Add support for other pages if we add them back in
                    // } else {
                    //     resultsMutation.results = removeAllResultOccurrencesOfPage(
                    //         results,
                    //         pageId,
                    //     )
                }

                this.emitMutation({
                    searchResults: resultsMutation,
                    modals: {
                        deletingPageArgs: { $set: undefined },
                    },
                })
                await this.options.searchBG.delPages([pageResult.pageId])
            },
        )
    }

    bulkSelectItems: EventHandler<'bulkSelectItems'> = async ({
        event,
        previousState,
    }) => {
        let selectedUrls: BulkEditCollection =
            previousState.bulkSelectedUrls ?? {}
        if (event.remove) {
            delete selectedUrls[event.item.url]
        } else {
            if (selectedUrls[event.item.url] == null) {
                selectedUrls[event.item.url] = {
                    type: event.item.type,
                }
            }
        }
        this.emitMutation({
            bulkSelectedUrls: { $set: selectedUrls },
        })

        const itemToSave = {}
        itemToSave[event.item.url] = {
            url: event.item.url,
            type: event.item.type,
        }

        await setBulkEdit(itemToSave, event.remove)
    }

    bulkDeleteItem: EventHandler<'bulkDeleteItem'> = async ({
        event,
        previousState,
    }) => {
        await executeUITask(
            this,
            (taskState) => ({
                bulkDeleteLoadingState: { $set: taskState },
                searchResults: { searchState: { $set: taskState } },
            }),
            async () => {
                try {
                    const itemsInStorage: BulkEditCollection = await getBulkEditItems()

                    let pagesToDelete = []
                    let notesToDelete = []

                    for (const [url, item] of Object.entries(itemsInStorage)) {
                        if (item.type === 'page') {
                            pagesToDelete.push(url)
                        }
                        if (item.type === 'note') {
                            notesToDelete.push(url)
                        }
                    }

                    const chunkSize = 100
                    const numChunksPagesDelete = Math.ceil(
                        pagesToDelete.length / chunkSize,
                    )

                    for (let i = 0; i < numChunksPagesDelete; i++) {
                        const start = i * chunkSize
                        const end = start + chunkSize
                        const chunk = pagesToDelete.slice(start, end)
                        // const chunkStorage = itemsForStorage.slice(start, end)
                        await this.options.searchBG.delPages(chunk)
                        // await setBulkEdit(chunkStorage, true)
                    }
                    for (let annotation of notesToDelete) {
                        await this.options.annotationsBG.deleteAnnotation(
                            annotation,
                        )
                        // await setBulkEdit(chunkStorage, true)
                    }

                    await clearBulkEditItems()
                    window.location.reload()
                } catch (e) {
                    console.error('eerorr', e)
                }
            },
        )
    }

    // bulkDeleteNote: EventHandler<'bulkDeleteNote'> = async ({
    //     previousState: { modals, searchResults },
    // }) => {
    //     const { noteId, pageId, day } = modals.deletingNoteArgs
    //     const pageResult = searchResults.results[day].pages.byId[pageId]
    //     const pageResultNoteIds = pageResult.noteIds[
    //         pageResult.notesType
    //     ].filter((id) => id !== noteId)
    //     const notesAllIds = searchResults.noteData.allIds.filter(
    //         (id) => id !== noteId,
    //     )

    //     await executeUITask(
    //         this,
    //         (taskState) => ({
    //             searchResults: { noteDeleteState: { $set: taskState } },
    //         }),
    //         async () => {
    //             await this.options.annotationsBG.deleteAnnotation(noteId)

    //             this.emitMutation({
    //                 modals: {
    //                     deletingNoteArgs: { $set: undefined },
    //                 },
    //                 searchResults: {
    //                     results: {
    //                         [day]: {
    //                             pages: {
    //                                 byId: {
    //                                     [pageId]: {
    //                                         noteIds: {
    //                                             [pageResult.notesType]: {
    //                                                 $set: pageResultNoteIds,
    //                                             },
    //                                         },
    //                                     },
    //                                 },
    //                             },
    //                         },
    //                     },
    //                     noteData: {
    //                         allIds: { $set: notesAllIds },
    //                         byId: { $unset: [noteId] },
    //                     },
    //                 },
    //             })
    //         },
    //     )
    // }

    private handleDefaultTemplateCopy = async (
        annotationUrls,
        normalizedPageUrls,
    ) => {
        try {
            const templates = await this.options.copyPasterBG.findAllTemplates()
            const sortedTemplates = templates.sort(defaultOrderableSorter)
            const id = sortedTemplates[0].id

            const item = templates.find((item) => item.id === id)

            const rendered = await this.options.copyPasterBG.renderTemplate({
                id,
                annotationUrls: annotationUrls,
                normalizedPageUrls: normalizedPageUrls,
            })

            if (item) {
                if (
                    item.outputFormat === 'markdown' ||
                    item.outputFormat == null
                ) {
                    await copyToClipboard(rendered)
                }
                if (item.outputFormat === 'rich-text') {
                    const htmlString = md.render(rendered)
                    await this.copyRichTextToClipboard(htmlString)
                }
            }
        } catch (err) {
            captureException(err)
            return false
        } finally {
            analytics.trackEvent({
                category: 'TextExporter',
                action: 'copyToClipboard',
            })

            return true
        }
    }

    async copyRichTextToClipboard(html: string) {
        // Create a hidden content-editable div
        const hiddenDiv = document.createElement('div')

        hiddenDiv.contentEditable = 'true'
        hiddenDiv.style.position = 'absolute'
        hiddenDiv.style.left = '-9999px'
        hiddenDiv.innerHTML = html

        // Append the hidden div to the body
        document.body.appendChild(hiddenDiv)

        // Select the content of the hidden div
        const range = document.createRange()
        range.selectNodeContents(hiddenDiv)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)

        // Copy the selected content to the clipboard
        document.execCommand('copy')

        // Remove the hidden div from the body
        document.body.removeChild(hiddenDiv)
    }

    setCopyPasterDefaultExecute: EventHandler<
        'setCopyPasterDefaultExecute'
    > = async ({ event, previousState }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageResultId]: {
                                    copyLoadingState: {
                                        $set: 'running',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        let templateCopyResult
        if (
            !previousState.searchResults.results[event.day]?.pages.byId[
                event.pageResultId
            ].isCopyPasterShown
        ) {
            templateCopyResult = await this.handleDefaultTemplateCopy(
                [null],
                [event.pageResultId],
            )
        }

        if (templateCopyResult) {
            this.emitMutation({
                searchResults: {
                    results: {
                        [event.day]: {
                            pages: {
                                byId: {
                                    [event.pageResultId]: {
                                        copyLoadingState: {
                                            $set: 'success',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            })

            setTimeout(() => {
                this.emitMutation({
                    searchResults: {
                        results: {
                            [event.day]: {
                                pages: {
                                    byId: {
                                        [event.pageResultId]: {
                                            copyLoadingState: {
                                                $set: 'pristine',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                })
            }, 3000)
        }
    }
    setPageCopyPasterShown: EventHandler<'setPageCopyPasterShown'> = ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageResultId]: {
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
                                [event.pageResultId]: {
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
                                [event.pageResultId]: {
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
                                [event.pageResultId]: {
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
        const previousPageId = previousState.activePageID
            ? previousState.searchResults?.pageIdToResultIds[
                  previousState.activePageID
              ][0]
            : null

        if (previousPageId) {
            this.emitMutation({
                searchResults: {
                    results: {
                        [previousState.activeDay]: {
                            pages: {
                                byId: {
                                    [previousPageId]: {
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

        if (event.activePageID == null && event.activeDay == null) {
            this.emitMutation({
                activeDay: { $set: undefined },
                activePageID: { $set: undefined },
            })
            return
        }

        const pageId =
            previousState.searchResults.pageIdToResultIds[event.activePageID][0]

        this.emitMutation({
            activeDay: { $set: event.activeDay },
            activePageID: { $set: event.activePageID },
            searchResults: {
                results: {
                    [event.activeDay]: {
                        pages: {
                            byId: {
                                [pageId]: {
                                    activePage: {
                                        $set: event.activePage,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    shiftSelectItems: EventHandler<'shiftSelectItems'> = ({
        event,
        previousState,
    }) => {
        // let currentIndex = event.selectedIndex
        // let results = previousState.searchResults.results
        // let docs = Object.values(results)
        // let docId = null
        // if (event.type ==='pages') {
        //     docId = docs[0].pages.allIds[currentIndex]
        // } else if (event.type === 'notes') {
        //     docId = docs[0].pages.byId[docs[0].pages.allIds[0]].noteIds.user[currentIndex]
        // }
        // while (!previousState.bulkSelectedUrls.includes(pageData.normalizedUrl)) {
        //     if (pageData == null) {
        //         return
        //     }
        //     const data = {
        //         title: pageData.fullTitle,
        //         url: pageData.normalizedUrl,
        //         type: 'pages',
        //     }
        //     await this.props.onBulkSelect(data, false)
        //     currentIndex = currentIndex - 1
        //     pageId = this.props.pageData.allIds[currentIndex]
        //     pageData = this.props.pageData.byId[pageId]
        // }
        // }
    }

    setPageNotesShown: EventHandler<'setPageNotesShown'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                shouldFormsAutoFocus: { $set: event.areShown },
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageResultId]: {
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
        const page =
            searchResults.results[event.day]?.pages.byId[event.pageResultId]

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
                                [event.pageResultId]: {
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
                                [event.pageResultId]: {
                                    notesType: { $set: event.noteType },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    onMainContentHover: EventHandler<'setPageHover'> = ({
        event,
        previousState,
    }) => {
        this.setHoverState(
            event.day,
            event.pageResultId,
            event.hover,
            previousState,
        )
    }

    setHoverState(day, pageResultId, hover, previousState) {
        this.processUIEvent('setPageHover', {
            event: { pageResultId, day, hover },
            previousState,
        })
        this.processUIEvent('changeFocusItem', {
            event: {
                item: { id: pageResultId, type: 'page' },
            },
            previousState,
        })
    }

    setPageHover: EventHandler<'setPageHover'> = ({ event, previousState }) => {
        const emitMutation = () =>
            this.emitMutation({
                searchResults: {
                    results: {
                        [event.day]: {
                            pages: {
                                byId: {
                                    [event.pageResultId]: {
                                        hoverState: { $set: event.hover },
                                    },
                                },
                            },
                        },
                    },
                    // pageData: {
                    //     byId: {
                    //         [event.pageResultId]: {
                    //             isInFocus: {
                    //                 $set:
                    //                     event.hover == null
                    //             },
                    //         },
                    //     },
                    // },
                },
            })

        if (
            previousState.searchResults.results[event.day]?.pages.byId[
                event.pageResultId
            ].isCopyPasterShown ||
            previousState.searchResults.results[event.day]?.pages.byId[
                event.pageResultId
            ].listPickerShowStatus !== 'hide'
        ) {
            return
        }

        emitMutation()
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
                                [event.pageResultId]: {
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

    setPageNewNoteLists: EventHandler<'setPageNewNoteLists'> = ({
        event,
        previousState,
    }) => {
        const existingLists =
            previousState.searchResults.results[event.day].pages.byId[
                event.pageResultId
            ].newNoteForm.lists
        const uniqueLists = event.lists.filter(
            (list) => !existingLists.includes(list),
        )

        this.emitMutation({
            searchResults: {
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageResultId]: {
                                    newNoteForm: {
                                        lists: { $set: uniqueLists },
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
                                [event.pageResultId]: {
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
                                [event.pageResultId]: {
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

    addNewSpaceViaWikiLinksNewNote: EventHandler<
        'addNewSpaceViaWikiLinksNewNote'
    > = async ({ event, previousState }) => {
        const {
            localListId,
            remoteListId,
            collabKey,
        } = await this.options.listsBG.createCustomList({
            name: event.spaceName,
        })

        const { unifiedId } = this.options.annotationsCache.addList({
            name: event.spaceName,
            collabKey,
            localId: localListId,
            remoteId: remoteListId,
            hasRemoteAnnotationsToLoad: false,
            type: 'user-list',
            unifiedAnnotationIds: [],
            creator:
                previousState.currentUser != null
                    ? {
                          type: 'user-reference',
                          id: previousState.currentUser.id,
                      }
                    : undefined,
            parentLocalId: null,
            isPrivate: true,
        })

        const listsToAdd = [
            ...previousState.searchResults.results[event.day].pages.byId[
                event.pageId
            ].newNoteForm.lists,
            unifiedId,
        ]

        this.processUIEvent('setPageNewNoteLists', {
            event: {
                day: event.day,
                pageResultId: event.pageId,
                lists: listsToAdd,
            },
            previousState,
        })
    }

    updateSpacesSearchSuggestions: EventHandler<
        'updateSpacesSearchSuggestions'
    > = async ({ event, previousState }) => {
        const lists = this.options.annotationsCache.lists.allIds
            .filter(
                (listId) =>
                    this.options.annotationsCache.lists.byId[listId].name
                        .toLowerCase()
                        .includes(event.searchQuery.toLowerCase()) &&
                    this.options.annotationsCache.lists.byId[listId].type !==
                        'page-link',
            )
            .map((listId) => ({
                id: this.options.annotationsCache.lists.byId[listId].localId,
                name: this.options.annotationsCache.lists.byId[listId].name,
            }))

        this.emitMutation({
            spaceSearchSuggestions: { $set: lists },
        })
    }

    savePageNewNote: EventHandler<'savePageNewNote'> = async ({
        event,
        previousState,
    }) => {
        const { annotationsBG, contentShareBG } = this.options
        const formState =
            previousState.searchResults.results[event.day].pages.byId[
                event.pageResultId
            ].newNoteForm
        const listsToAdd = formState.lists.map((listId) =>
            getListData(listId, previousState, {
                mustBeLocal: true,
                source: 'savePageNewNote',
            }),
        )

        let syncSettings: SyncSettingsStore<'extension'>

        syncSettings = createSyncSettingsStore({
            syncSettingsBG: this.options.syncSettingsBG,
        })

        const shouldSetAsAutoAdded = await syncSettings.extension.get(
            'shouldAutoAddSpaces',
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
                        shouldShare: shouldSetAsAutoAdded || event.shouldShare,
                        isBulkShareProtected: event.isProtected,
                        shouldCopyShareLink: event.shouldShare,
                    },
                    annotationsBG,
                    contentSharingBG: contentShareBG,
                    skipPageIndexing: true,
                    syncSettingsBG: this.options.syncSettingsBG,
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
                                        pageUrl: event.pageResultId,
                                        isShared:
                                            shouldSetAsAutoAdded ||
                                            event.shouldShare,
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
                                        [event.pageResultId]: {
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

        if (previousState.showAllNotes) {
            this.emitMutation({
                showAllNotes: { $set: false },
            })
        } else {
            this.emitMutation({
                showAllNotes: { $set: true },
            })
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

    toggleNoteSidebarOn: EventHandler<'toggleNoteSidebarOn'> = async ({
        event,
        previousState,
    }) => {
        if (previousState.showFullScreen == null) {
            this.emitMutation({
                showFullScreen: { $set: true },
            })
        }

        this.emitMutation({
            isNoteSidebarShown: { $set: true },
        })
    }

    onMatchingTextToggleClick: EventHandler<
        'onMatchingTextToggleClick'
    > = async ({ event, previousState }) => {
        const previousValue =
            previousState.searchResults.results[-1].pages.byId[
                event.pageResultId
            ]?.showAllResults
        this.emitMutation({
            searchResults: {
                results: {
                    [-1]: {
                        pages: {
                            byId: {
                                [event.pageResultId]: {
                                    showAllResults: { $set: !previousValue },
                                },
                            },
                        },
                    },
                },
            },
        })
    }
    toggleNoteSidebarOff: EventHandler<'toggleNoteSidebarOn'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            isNoteSidebarShown: { $set: false },
        })
    }

    confirmNoteDelete: EventHandler<'confirmNoteDelete'> = async ({
        previousState: { modals, searchResults },
    }) => {
        if (!modals.deletingNoteArgs) {
            throw new Error('No note ID is set for deletion')
        }

        const { noteId, pageResultId, day } = modals.deletingNoteArgs
        const pageResult = searchResults.results[day].pages.byId[pageResultId]
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
                                        [pageResultId]: {
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
    setBodyEditing: EventHandler<'setBodyEditing'> = ({ event }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            isBodyEditing: { $set: event.isEditing },
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

    setCopyPasterDefaultNoteExecute: EventHandler<
        'setCopyPasterDefaultNoteExecute'
    > = async ({ event, previousState }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            copyLoadingState: { $set: 'running' },
                        },
                    },
                },
            },
        })

        let templateCopyResult
        if (
            !previousState.searchResults.noteData.byId[event.noteId]
                .isCopyPasterShown
        ) {
            templateCopyResult = await this.handleDefaultTemplateCopy(
                [event.noteId],
                null,
            )
        }

        if (templateCopyResult) {
            this.emitMutation({
                searchResults: {
                    noteData: {
                        byId: {
                            [event.noteId]: {
                                copyLoadingState: { $set: 'success' },
                            },
                        },
                    },
                },
            })

            setTimeout(() => {
                this.emitMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [event.noteId]: {
                                    copyLoadingState: { $set: 'pristine' },
                                },
                            },
                        },
                    },
                })
            }, 3000)
        }
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

        const noteListIds = new Set(noteData.lists)

        if (noteListIds.has(event.added)) {
            return
        }

        const pageData =
            previousState.searchResults.pageData.byId[noteData.pageUrl]
        const listData = getListData(
            event.added ?? event.deleted,
            previousState,
            { mustBeLocal: true, source: 'setNoteLists' },
        )

        let remoteFn: () => Promise<any>

        const pageListIds = new Set(pageData.lists)

        if (event.added != null) {
            remoteFn = () =>
                contentShareBG.shareAnnotationToSomeLists({
                    annotationUrl: event.noteId,
                    localListIds: [listData.localId],
                    protectAnnotation: true,
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

        const searchResultsMutation: UIMutation<State['searchResults']> = {
            noteData: {
                byId: {
                    [event.noteId]: {
                        lists: {
                            $set: noteData.isShared
                                ? [...new Set([...pageListIds, ...noteListIds])]
                                : [...noteListIds],
                        },
                        isShared: { $set: false }, // All cases of direct list add/del to an annot results in it becoming selectively shared (losing auto-added state)
                        isBulkShareProtected: {
                            $set: true,
                        },
                    },
                },
            },
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
        const pageURL = 'https://' + normalizeUrl(event.noteId)

        await this.options.contentScriptsBG.goToAnnotationFromDashboardSidebar({
            fullPageUrl: pageURL,
            annotationCacheId: event.noteId,
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
            // modals: {
            //     confirmPrivatizeNoteArgs: { $set: null },
            //     confirmSelectNoteSpaceArgs: { $set: null },
            // },
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
    setNoteEditBodyValue: EventHandler<'setNoteEditBodyValue'> = ({
        event,
    }) => {
        this.emitMutation({
            searchResults: {
                noteData: {
                    byId: {
                        [event.noteId]: {
                            editNoteForm: {
                                bodyInputValue: { $set: event.value },
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
                            isBodyEditing: { $set: false },
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

                const isAnnotBecomingAutoAdded =
                    !existing.isShared && event.shouldShare && event.isProtected
                const nextLists = isAnnotBecomingAutoAdded
                    ? [
                          ...(previousState.searchResults.pageData.byId[
                              existing.pageUrl
                          ]?.lists ?? []),
                      ]
                    : [...existing.lists]

                const bodyToSave = processCommentForImageUpload(
                    editNoteForm.bodyInputValue ?? existing.highlight ?? null,
                )
                const commentToSave = processCommentForImageUpload(
                    editNoteForm.inputValue ?? existing.comment,
                )

                this.emitMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [event.noteId]: {
                                    isEditing: { $set: false },
                                    isBodyEditing: { $set: false },
                                    tags: { $set: editNoteForm.tags },
                                    isShared: { $set: event.shouldShare },
                                    comment: {
                                        $set: commentToSave,
                                    },
                                    highlight: {
                                        $set: bodyToSave,
                                    },
                                    isBulkShareProtected: {
                                        $set:
                                            event.isProtected ||
                                            !!event.keepListsIfUnsharing,
                                    },
                                    lists: { $set: nextLists },
                                    color: {
                                        $set: (event.color ??
                                            existing.color) as string,
                                    },
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
                        comment: commentToSave,
                        color: event.color ?? existing.color,
                        body: bodyToSave,
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
        if (!event.isInPageMode) {
            this.updateQueryStringParameter('query', event.query)
        }
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
        this.emitMutation({
            searchFilters: {
                dateFromInput: { $set: event.value ? event.value : '' },
            },
        })
    }

    setDateToInputValue: EventHandler<'setDateToInputValue'> = async ({
        event,
    }) => {
        this.emitMutation({
            searchFilters: {
                dateToInput: { $set: event.value },
            },
        })
    }

    setDateFrom: EventHandler<'setDateFrom'> = async ({
        event,
        previousState,
    }) => {
        if (!event.value) {
            this.removeQueryString('from')
            await this.mutateAndTriggerSearch(previousState, {
                searchFilters: { dateFrom: { $set: undefined } },
            })
        } else {
            this.updateQueryStringParameter('from', event.value.toString())
            await this.mutateAndTriggerSearch(previousState, {
                searchFilters: { dateFrom: { $set: event.value } },
            })
        }
    }

    setDateTo: EventHandler<'setDateTo'> = async ({ event, previousState }) => {
        if (!event.value) {
            this.removeQueryString('to')
            await this.mutateAndTriggerSearch(previousState, {
                searchFilters: { dateTo: { $set: undefined } },
            })
        } else {
            this.updateQueryStringParameter('to', event.value.toString())
            await this.mutateAndTriggerSearch(previousState, {
                searchFilters: { dateTo: { $set: event.value } },
            })
        }
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
        let localListIds = new Set<number>()

        if (previousState.searchFilters.spacesIncluded.length > 0) {
            localListIds = new Set(previousState.searchFilters.spacesIncluded)
        }

        localListIds.add(event.spaceId)

        if (previousState.listsSidebar.selectedListId != null) {
            const selectedLocalListId = this.options.annotationsCache.lists
                .byId[previousState.listsSidebar.selectedListId]?.localId
            if (
                selectedLocalListId != null &&
                selectedLocalListId !== event.spaceId
            ) {
                localListIds.add(selectedLocalListId)
            }
        }

        if (!this.islikelyInPage) {
            this.updateQueryStringParameter(
                'spaces',
                Array.from(localListIds).toString(),
            )
        }

        await this.mutateAndTriggerSearch(previousState, {
            searchFilters: {
                spacesIncluded: { $set: Array.from(localListIds) },
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

        const newListFilter = previousState.searchFilters.spacesIncluded.filter(
            (item) => item !== event.spaceId,
        )

        if (!this.islikelyInPage) {
            this.updateQueryStringParameter('spaces', newListFilter.toString())
        }

        if (newListFilter.length === 0) {
            this.removeQueryString('spaces')
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
            listsSidebar: { selectedListId: { $set: null } },
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
        if (previousState.listsSidebar.isSidebarLocked) {
            return
        }

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
        let filteredLists = filterListsByQuery(
            event.query,
            normalizedStateToArray(previousState.listsSidebar.lists),
        )
        let trimmedQuery = event.query.trim()
        let nextFilteredListIds =
            trimmedQuery.length > 0
                ? [
                      ...new Set(
                          filteredLists.flatMap((list) => [
                              list.unifiedId,
                              ...list.pathUnifiedIds, // Include ancestors of matched lists
                          ]),
                      ),
                  ]
                : []

        this.emitMutation({
            listsSidebar: {
                searchQuery: { $set: event.query },
                filteredListIds: { $set: nextFilteredListIds },
                // Basically we want to reset state.focusedListId to null if the prev list no longer shows up in the filtered lists.
                // This is so "Enter" press on focused list can easily distingush the actions of "select list" and "create new list"
                //  - the latter only working when there is NO focused list AND some query exists AND no matches to the query.
                focusedListId: {
                    $apply: (prev) => {
                        if (
                            !nextFilteredListIds.length &&
                            !trimmedQuery.length
                        ) {
                            return prev
                        }
                        return nextFilteredListIds.includes(prev) ? prev : null
                    },
                },
            },
        })
    }

    private calcNextFocusedList(
        state: State,
        listTreesState: ListTreesState,
        change: -1 | 1 = 1,
    ): string {
        let lists = getOwnLists(
            normalizedStateToArray(state.listsSidebar.lists),
            state.currentUser,
        )
            .filter((list) =>
                state.listsSidebar.filteredListIds.length
                    ? state.listsSidebar.filteredListIds.includes(
                          list.unifiedId,
                      )
                    : true,
            )
            .sort(defaultOrderableSorter)

        let visibleTreeNodes = getVisibleTreeNodesInOrder(
            lists,
            listTreesState,
            {
                areListsBeingFiltered:
                    state.listsSidebar.filteredListIds.length > 0,
            },
        )

        let currentIndex = -1
        if (state.listsSidebar.focusedListId != null) {
            currentIndex = visibleTreeNodes.findIndex(
                (node) => node.unifiedId === state.listsSidebar.focusedListId,
            )
        }

        let nextIndex = currentIndex === -1 ? 0 : currentIndex + change

        // Loop back around if going out-of-bounds
        if (nextIndex < 0) {
            nextIndex = visibleTreeNodes.length - 1
        } else if (nextIndex >= visibleTreeNodes.length) {
            nextIndex = 0
        }

        let nextFocusedListId = visibleTreeNodes[nextIndex]?.unifiedId
        if (nextFocusedListId != null) {
            this.emitMutation({
                listsSidebar: { focusedListId: { $set: nextFocusedListId } },
            })
        }
        return nextFocusedListId
    }

    handleListQueryKeyPress: EventHandler<'handleListQueryKeyPress'> = async ({
        event,
        previousState,
    }) => {
        let listTreesRef = this.options.getListTreesRef()
        if (event.key === 'Escape') {
            this.emitMutation({ listsSidebar: { searchQuery: { $set: '' } } })
        } else if (event.key === 'Enter') {
            let canCreateNewList =
                previousState.listsSidebar.searchQuery.trim().length &&
                !previousState.listsSidebar.filteredListIds.length

            if (previousState.listsSidebar.focusedListId != null) {
                await this._setSelectedListId(
                    previousState,
                    previousState.listsSidebar.focusedListId,
                )
            } else if (canCreateNewList) {
                await this.createNewList(
                    previousState,
                    previousState.listsSidebar.searchQuery,
                )
            }
        } else if (event.key === 'ArrowUp' && listTreesRef) {
            this.calcNextFocusedList(previousState, listTreesRef.state, -1)
        } else if (event.key === 'ArrowDown' && listTreesRef) {
            this.calcNextFocusedList(previousState, listTreesRef.state, 1)
        } else if (
            (event.key === 'ArrowRight' &&
                listTreesRef?.state.listTrees.byId[
                    previousState.listsSidebar.focusedListId
                ]?.areChildrenShown === false) ||
            (event.key === 'ArrowLeft' &&
                listTreesRef?.state.listTrees.byId[
                    previousState.listsSidebar.focusedListId
                ]?.areChildrenShown === true)
        ) {
            listTreesRef.processEvent('toggleShowChildren', {
                listId: previousState.listsSidebar.focusedListId,
            })
        }
    }

    setFocusedListId: EventHandler<'setFocusedListId'> = async ({ event }) => {
        this.emitMutation({
            listsSidebar: { focusedListId: { $set: event.listId } },
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
        await this.createNewList(previousState, event.value)
    }

    private async createNewList(previousState: State, name: string) {
        const newListName = name.trim()
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
                    type: 'user-list',
                    name: newListName,
                    localId: localListId,
                    unifiedAnnotationIds: [],
                    hasRemoteAnnotationsToLoad: false,
                    isPrivate: true,
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
                        areLocalListsExpanded: { $set: true },
                        addListErrorMessage: { $set: null },
                        searchQuery: { $set: '' },
                    },
                })
                const {
                    collabKey,
                    remoteListId,
                } = await this.options.listsBG.createCustomList({
                    name: newListName,
                    id: localListId,
                })
                this.options.annotationsCache.updateList({
                    unifiedId,
                    collabKey,
                    remoteId: remoteListId,
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
        await this._setSelectedListId(previousState, event.listId)
    }

    private async _setSelectedListId(previousState: State, listId: string) {
        const listIdToSet =
            previousState.listsSidebar.selectedListId === listId ? null : listId

        if (listIdToSet != null) {
            if (listIdToSet === '20201014' || listIdToSet === '20201015') {
                this.updateQueryStringParameter('selectedSpace', listIdToSet)
            } else {
                const listData = getListData(listIdToSet, previousState, {
                    mustBeLocal: true,
                    source: 'setSelectedListId',
                })
                this.updateQueryStringParameter(
                    'selectedSpace',
                    listData.localId!.toString(),
                )
            }
        } else {
            this.updateQueryStringParameter('selectedSpace', null)
        }

        await this.mutateAndTriggerSearch(previousState, {
            listsSidebar: { selectedListId: { $set: listIdToSet } },
        })
    }

    updatePageTitle: EventHandler<'updatePageTitle'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            searchResults: {
                pageData: {
                    byId: {
                        [event.normalizedPageUrl]: {
                            fullTitle: { $set: event.changedTitle },
                        },
                    },
                },
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    editTitleState: {
                                        $set: null,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })

        this.options.pageIndexingBG.updatePageTitle({
            normaliedPageUrl: event.normalizedPageUrl,
            title: event.changedTitle,
        })
    }
    updatePageTitleState: EventHandler<'updatePageTitle'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({
            searchResults: {
                pageData: {
                    byId: {
                        [event.normalizedPageUrl]: {
                            editTitleState: {
                                $set: event.changedTitle,
                            },
                        },
                    },
                },
                results: {
                    [event.day]: {
                        pages: {
                            byId: {
                                [event.pageId]: {
                                    editTitleState: {
                                        $set: event.changedTitle,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    }

    setDragOverListId: EventHandler<'setDragOverListId'> = ({
        event,
        previousState,
    }) => {
        if (event.listId === previousState.listsSidebar.dragOverListId) {
            return
        }
        this.emitMutation({
            listsSidebar: { dragOverListId: { $set: event.listId } },
        })
    }

    dragPage: EventHandler<'dragPage'> = async ({ event, previousState }) => {
        this.emitMutation({
            searchResults: { draggedPageId: { $set: event.pageResultId } },
        })
        let crt = this.options.document.getElementById(DRAG_EL_ID)
        crt.style.display = 'block'
        event.dataTransfer.setDragImage(crt, 0, 0)

        let pageResult =
            previousState.searchResults.results[event.day].pages.byId[
                event.pageResultId
            ]
        let pageData =
            previousState.searchResults.pageData.byId[pageResult.pageId]
        const action: DragPageToListAction = {
            type: 'page',
            fullPageUrl: pageData.fullUrl,
            normalizedPageUrl: pageData.normalizedUrl,
        }
        event.dataTransfer.setData('text/plain', JSON.stringify(action))
    }

    dropPage: EventHandler<'dropPage'> = async () => {
        this.emitMutation({
            searchResults: { draggedPageId: { $set: undefined } },
        })
    }

    private parseDragDropAction(
        dataTransfer: DataTransfer,
    ): DragPageToListAction | null {
        let action: DragPageToListAction
        try {
            action = JSON.parse(dataTransfer.getData('text/plain'))
            if (action?.type !== 'page') {
                throw new Error('Unexpected data received')
            }
        } catch (err) {
            console.error('Error parsing ondrop event data transfer data:', err)
            return null
        }
        return action
    }

    dropOnListItem: EventHandler<'dropOnListItem'> = async ({
        event,
        previousState,
    }) => {
        const action = this.parseDragDropAction(event.dataTransfer)
        if (!action || action.type !== 'page') {
            return
        }

        await executeUITask(
            this,
            (taskState) => ({
                listsSidebar: { listDropReceiveState: { $set: taskState } },
            }),
            async () =>
                this.handleDropPageOnListItem(
                    event.listId,
                    action,
                    previousState,
                ),
        )
    }

    private async handleDropPageOnListItem(
        dropTargetListId: string,
        { fullPageUrl, normalizedPageUrl }: DragPageToListAction,
        previousState: State,
    ): Promise<void> {
        if (fullPageUrl == null || normalizedPageUrl == null) {
            return
        }

        const listData = getListData(dropTargetListId, previousState, {
            mustBeLocal: true,
            source: 'dropOnListItem',
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
                        [dropTargetListId]: {
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
                                    lists.includes(dropTargetListId)
                                        ? lists
                                        : [...lists, dropTargetListId],
                            },
                        },
                    },
                },
            },
        })

        setTimeout(() => {
            this.emitMutation({
                listsSidebar: {
                    lists: {
                        byId: {
                            [dropTargetListId]: {
                                wasPageDropped: { $set: false },
                            },
                        },
                    },
                },
            })
        }, 2000)

        await this.options.listsBG.insertPageToList({
            id: listData.localId!,
            url: fullPageUrl,
            skipPageIndexing: true,
        })
    }

    clickPageResult: EventHandler<'clickPageResult'> = async ({
        event,
        previousState,
    }) => {
        const id = event.pageResultId.split('-')[1]

        const pageData = previousState?.searchResults?.pageData?.byId[id]

        if (!pageData) {
            return
        }

        if (pageData?.fullUrl.includes('memex.cloud/')) {
            // This event will be assigned to an anchor <a> el, so we need to override that for PDFs
            event.synthEvent.preventDefault()

            const pdfUrl = pageData.fullUrl
            const PDFurlwithID = await this.options.searchBG.resolvePdfPageFullUrls(
                pdfUrl,
            )

            const memexCloudUrl = new URL(PDFurlwithID.originalLocation)
            const uploadId = memexCloudUrl?.searchParams.get('upload_id')

            // Uploaded PDFs need to have temporary access URLs fetched
            if (uploadId != null) {
                // Ignore multi-clicks while it's loading
                // if (
                //     previousState.searchResults.uploadedPdfLinkLoadState ===
                //     'running'
                // ) {
                //     return
                // }

                await executeUITask(
                    this,
                    (taskState) => ({
                        searchResults: {
                            pageData: {
                                byId: {
                                    [id]: {
                                        uploadedPdfLinkLoadState: {
                                            $set: taskState,
                                        },
                                    },
                                },
                            },
                        },
                    }),
                    async () => {
                        const tempPdfAccessUrl = await this.options.pdfViewerBG.getTempPdfAccessUrl(
                            uploadId,
                        )
                        await openPDFInViewer(tempPdfAccessUrl, {
                            tabsAPI: this.options.tabsAPI,
                            runtimeAPI: this.options.runtimeAPI,
                        })
                    },
                )
                return
            }

            if (memexCloudUrl?.protocol === 'blob:') {
                // Show dropzone for local-only PDFs
                const input = document.createElement('input')
                input.type = 'file'
                input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files![0]
                    const reader = new FileReader()
                    reader.onload = (event) => {
                        const pdfDataUrl = event.target!.result as string
                        // this.emitMutation({ pdfDataUrl: { $set: pdfDataUrl } })
                    }
                    reader.readAsDataURL(file)

                    // const file = firstItem.getAsFile()
                    const pdfObjectUrl = URL.createObjectURL(file)

                    await openPDFInViewer(pdfObjectUrl, {
                        tabsAPI: this.options.tabsAPI,
                        runtimeAPI: this.options.runtimeAPI,
                    })
                    this.emitMutation({ showDropArea: { $set: false } })
                }
                input.click()
                this.emitMutation({ showDropArea: { $set: true } })
            }

            await openPDFInViewer(PDFurlwithID.originalLocation, {
                tabsAPI: this.options.tabsAPI,
                runtimeAPI: this.options.runtimeAPI,
            })
        }

        // if (pageData?.fullUrl && !pageData?.fullUrl) {
        //     window.open(pageData.fullUrl, '_blank')
        // }
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

    setListPrivacy: EventHandler<'setListPrivacy'> = async ({ event }) => {
        const { annotationsCache, contentShareBG } = this.options
        const list = annotationsCache.lists.byId[event.listId]
        if (list?.localId == null) {
            throw new Error('Tried to set privacy for non-cached list')
        }
        annotationsCache.updateList({
            unifiedId: event.listId,
            isPrivate: event.isPrivate,
        })
        await contentShareBG.updateListPrivacy({
            localListId: list.localId,
            isPrivate: event.isPrivate,
        })
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

                if (!event.skipDBOps) {
                    await this.options.listsBG.updateListName({
                        id: listData.localId,
                        oldName,
                        newName,
                    })
                }
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
    setEditMenuListId: EventHandler<'setEditMenuListId'> = async ({
        event,
        previousState,
    }) => {
        const listIdToSet =
            previousState.listsSidebar.editMenuListId === event.listId
                ? undefined
                : event.listId

        this.emitMutation({
            listsSidebar: {
                editMenuListId: { $set: listIdToSet },
                editingListId: { $set: listIdToSet },
            },
        })
    }

    toggleTheme: EventHandler<'toggleTheme'> = async ({ previousState }) => {
        const nextTheme =
            previousState.themeVariant === 'dark' ? 'light' : 'dark'
        await this.options.localStorage.set({ themeVariant: nextTheme })
        this.emitMutation({ themeVariant: { $set: nextTheme } })
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

        const processedDescription = processCommentForImageUpload(
            event.description,
            null,
            null,
            this.options.imageSupportBG,
            false,
        ).toString()

        this.options.annotationsCache.updateList({
            unifiedId: selectedListId,
            description: processedDescription,
        })

        await this.options.listsBG.updateListDescription({
            description: processedDescription,
            listId: listData.localId!,
        })
    }

    setDeletingListId: EventHandler<'setDeletingListId'> = async ({
        event,
    }) => {
        this.emitMutation({
            modals: { deletingListId: { $set: event.listId } },
            // listsSidebar: { showMoreMenuListId: { $set: undefined } },
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
                this.emitMutation({
                    modals: { deletingListId: { $set: null } },
                    listsSidebar: {
                        selectedListId: { $set: undefined },
                        filteredListIds: {
                            $apply: (ids: string[]) =>
                                ids.filter((id) => id !== listId),
                        },
                    },
                })
                this.options.annotationsCache.removeList({ unifiedId: listId })

                // NOTE: This is performed inside SpaceContextMenuLogic.confirmSpaceDelete
                // TODO: Make this less disconnected
                // await this.options.contentShareBG.deleteListAndAllAssociatedData(
                //     { localListId: listData.localId! },
                // )
            },
        )
    }

    switchToFeed: EventHandler<'switchToFeed'> = async ({ previousState }) => {
        if (!(await this.ensureLoggedIn())) {
            return
        }

        this.emitMutation({
            listsSidebar: {
                selectedListId: { $set: SPECIAL_LIST_STRING_IDS.FEED },
            },
        })

        if (previousState.listsSidebar.hasFeedActivity) {
            this.emitMutation({
                listsSidebar: {
                    hasFeedActivity: { $set: false },
                },
            })
            await this.options.localStorage.set({
                [ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY]: false,
            })
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
