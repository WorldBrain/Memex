import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import type { RibbonContainerDependencies } from './types'
import * as componentTypes from '../../components/types'
import type { SharedInPageUIInterface } from 'src/in-page-ui/shared-state/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import {
    generateAnnotationUrl,
    shareOptsToPrivacyLvl,
} from 'src/annotations/utils'
import { resolvablePromise } from 'src/util/resolvable'
import type { FocusableComponent } from 'src/annotations/components/types'
import type { Analytics } from 'src/analytics'
import { createAnnotation } from 'src/annotations/annotation-save-logic'
import browser, { Browser, Storage } from 'webextension-polyfill'
import {
    enforceTrialPeriod30Days,
    pageActionAllowed,
} from '@worldbrain/memex-common/lib/subscriptions/storage'
import { sleepPromise } from 'src/util/promises'
import { getTelegramUserDisplayName } from '@worldbrain/memex-common/lib/telegram/utils'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'

export type PropKeys<Base, ValueCondition> = keyof Pick<
    Base,
    {
        [Key in keyof Base]: Base[Key] extends ValueCondition ? Key : never
    }[keyof Base]
>

// TODO: get rid of this stuff. I think it was added in an attempt to derive more from what already is there,
//   but ultimately it adds a lot more complexity around the types here, which doesn't exist on any other
//   UI logic class in the project. Makes it really difficult to alter the signatures of events here
type ValuesOf<Props> = Omit<Props, PropKeys<Props, Function>> // tslint:disable-line
type HandlersOf<Props> = {
    // tslint:disable-next-line
    [Key in PropKeys<Props, Function>]: Props[Key] extends (
        value: infer Arg,
    ) => void
        ? { value: Arg }
        : null
}
type SubcomponentHandlers<
    Subcomponent extends keyof componentTypes.RibbonSubcomponentProps
> = HandlersOf<componentTypes.RibbonSubcomponentProps[Subcomponent]>

export interface RibbonContainerState {
    currentUser: AuthenticatedUser | null
    fullPageUrl: string
    loadState: TaskState
    isRibbonEnabled: boolean | null
    tutorialIdToOpen: string
    isWidthLocked: boolean | null
    areExtraButtonsShown: boolean
    areTutorialShown: boolean
    showFeed: boolean
    showRemoveMenu: boolean
    highlights: ValuesOf<componentTypes.RibbonHighlightsProps>
    tooltip: ValuesOf<componentTypes.RibbonTooltipProps>
    // sidebar: ValuesOf<componentTypes.RibbonSidebarProps>
    commentBox: ValuesOf<componentTypes.RibbonCommentBoxProps>
    bookmark: ValuesOf<componentTypes.RibbonBookmarkProps>
    lists: ValuesOf<componentTypes.RibbonListsProps>
    annotations: number
    search: ValuesOf<componentTypes.RibbonSearchProps>
    pausing: ValuesOf<componentTypes.RibbonPausingProps>
    hasFeedActivity: boolean
    isTrial: boolean
    signupDate: number
    themeVariant: MemexThemeVariant
    showRabbitHoleButton: boolean
    showConfirmDeletion: boolean
}

export type RibbonContainerEvents = UIEvent<
    {
        show: null
        hide: null
        toggleRibbon: null
        highlightAnnotations: null
        toggleShowExtraButtons: null
        selectRibbonPositionOption: null
        toggleRemoveMenu: boolean | null
        setWriteError: { error: string }
        setTutorialId: { tutorialIdToOpen: string }
        toggleShowTutorial: null
        toggleFeed: null
        toggleReadingView: null
        toggleAskAI: boolean | null
        deletePage: null
        confirmDeletion: boolean
        toggleRabbitHole: null
        toggleQuickSearch: null
        toggleTheme: { themeVariant: MemexThemeVariant }
        openPDFinViewer: null
        hydrateStateFromDB: { url: string }
    } & SubcomponentHandlers<'highlights'> &
        SubcomponentHandlers<'tooltip'> &
        // SubcomponentHandlers<'sidebar'> &
        Omit<SubcomponentHandlers<'commentBox'>, 'saveComment'> & {
            saveComment: {
                shouldShare: boolean
                isProtected?: boolean
            }
        } & SubcomponentHandlers<'bookmark'> &
        SubcomponentHandlers<'lists'> &
        SubcomponentHandlers<'search'> &
        SubcomponentHandlers<'pausing'>
>

export interface RibbonContainerOptions extends RibbonContainerDependencies {
    inPageUI: SharedInPageUIInterface
    setRibbonShouldAutoHide: (value: boolean) => void
}

export interface RibbonLogicOptions extends RibbonContainerOptions {
    focusCreateForm: FocusableComponent['focus']
    analytics: Analytics
    analyticsBG: AnalyticsCoreInterface
    browserAPIs: Browser
}

type EventHandler<
    EventName extends keyof RibbonContainerEvents
> = UIEventHandler<RibbonContainerState, RibbonContainerEvents, EventName>

export const INITIAL_RIBBON_COMMENT_BOX_STATE = {
    commentText: '',
    showCommentBox: false,
    isCommentSaved: false,
    tags: [],
    lists: [],
}

export class RibbonContainerLogic extends UILogic<
    RibbonContainerState,
    RibbonContainerEvents
> {
    /**
     * This resolves once the `init` method logic resolves. Useful for stopping race-conditions
     * between ribbon loading and other state mutation events, particularly those that are triggered
     * by keyboard shortcuts - can happen before the ribbon is first loaded.
     */
    private initLogicResolvable = resolvablePromise()

    commentSavedTimeout = 2000
    readingView = false
    sidebar
    resizeObserver

    constructor(private dependencies: RibbonLogicOptions) {
        super()
    }

    getInitialState(): RibbonContainerState {
        return {
            currentUser: null,
            fullPageUrl: null,
            loadState: 'pristine',
            areExtraButtonsShown: false,
            areTutorialShown: false,
            showFeed: false,
            isWidthLocked: false,
            isRibbonEnabled: null,
            tutorialIdToOpen: null,
            showRemoveMenu: false,
            highlights: {
                areHighlightsEnabled: false,
            },
            tooltip: {
                isTooltipEnabled: undefined,
            },
            commentBox: INITIAL_RIBBON_COMMENT_BOX_STATE,
            bookmark: {
                writeError: null,
                loadState: 'pristine',
                isBookmarked: false,
                lastBookmarkTimestamp: undefined,
            },
            lists: {
                showListsPicker: false,
                pageListIds: [],
            },
            annotations: null,
            search: {
                showSearchBox: false,
                searchValue: '',
            },
            pausing: {
                isPaused: false,
            },
            hasFeedActivity: false,
            isTrial: false,
            signupDate: null,
            themeVariant: null,
            showRabbitHoleButton: false,
            showConfirmDeletion: false,
        }
    }

    init: EventHandler<'init'> = async (incoming) => {
        const { getFullPageUrl } = this.dependencies

        await loadInitial<RibbonContainerState>(this, async () => {
            let fullPageUrl = await getFullPageUrl()

            this.emitMutation({ fullPageUrl: { $set: fullPageUrl } })
            await this.hydrateStateFromDB({
                ...incoming,
                event: { url: fullPageUrl },
            })
        })
        this.initLogicResolvable.resolve()

        this.initReadingViewListeners()

        const themeVariant = await this.initThemeVariant()

        this.emitMutation({
            themeVariant: { $set: themeVariant },
        })

        try {
            const currentUser = await this.dependencies.authBG.getCurrentUser()
            if (currentUser) {
                const signupDate = new Date(currentUser?.creationTime).getTime()
                const isTrial =
                    (await enforceTrialPeriod30Days(
                        this.dependencies.browserAPIs,
                        signupDate,
                    )) ?? null

                if (isTrial) {
                    this.emitMutation({
                        isTrial: { $set: isTrial },
                        signupDate: { $set: signupDate },
                        currentUser: { $set: currentUser },
                    })
                }
            }
        } catch (error) {
            console.error('error in updatePageCounter', error)
        }
    }

    async initThemeVariant() {
        const variantStorage = await browser.storage.local.get('themeVariant')
        const variant = variantStorage['themeVariant']
        return variant ?? 'dark'
    }

    async initReadingViewListeners() {
        const readingViewState = await browser.storage.local.get(
            '@Sidebar-reading_view',
        )

        if (readingViewState['@Sidebar-reading_view'] === undefined) {
            await browser.storage.local.set({
                '@Sidebar-reading_view': true,
            })
            this.emitMutation({
                isWidthLocked: {
                    $set: true,
                },
            })
        } else {
            this.emitMutation({
                isWidthLocked: {
                    $set: readingViewState['@Sidebar-reading_view'],
                },
            })
        }

        // init listeners to local storage flag for reading view
        await browser.storage.onChanged.addListener((changes) => {
            this.setReadingWidthOnListener(changes)
        })
    }

    hydrateStateFromDB: EventHandler<'hydrateStateFromDB'> = async ({
        event: { url },
    }) => {
        // Stage 1: All relevant metadata
        let lists = []
        let interActionTimestamps = []

        this.emitMutation({
            fullPageUrl: { $set: url },
            bookmark: {
                isBookmarked: { $set: false },
                lastBookmarkTimestamp: { $set: null },
            },
        })

        let fullLists = await this.dependencies.customLists.fetchListPagesByUrl(
            { url: url },
        )

        fullLists
            .filter((list) => list.type !== 'page-link')
            .forEach((list) => {
                lists.push(list.id)
            })

        let fullListEntries = await this.dependencies.customLists.fetchPageListEntriesByUrl(
            { url: url },
        )

        fullListEntries.map((entry) => {
            let date = Math.floor(new Date(entry.createdAt).getTime() / 1000)
            interActionTimestamps.push(date)
        })

        const annotationsByURL = await this.dependencies.annotations.listAnnotationsByPageUrl(
            { pageUrl: normalizeUrl(url) },
        )

        // this section is there because sometimes when switching pages in web apps, the cache is still the old one when trying to see if the page has annotations
        annotationsByURL.map((annotation) => {
            return interActionTimestamps.push(
                Math.floor(annotation.createdWhen / 1000),
            )
        })

        // Set data for lists and annotations
        this.emitMutation({
            lists: { pageListIds: { $set: lists } },
            annotations: { $set: annotationsByURL.length },
        })

        const bookmark = await this.dependencies.bookmarks.findBookmark(url)

        const isBookmarked =
            bookmark || annotationsByURL.length > 0 || lists.length > 0

        if (bookmark?.time != null) {
            interActionTimestamps.push(bookmark.time)
        }
        const saveTime = Math.min.apply(Math, interActionTimestamps)
        this.emitMutation({
            bookmark: {
                isBookmarked: { $set: !!isBookmarked },
                lastBookmarkTimestamp: { $set: saveTime },
            },
        })

        // Enable Ribbon after everything set
        this.emitMutation({
            isRibbonEnabled: {
                $set: await this.dependencies.getSidebarEnabled(),
            },
        })

        const activityStatus = await this.dependencies.syncSettings.activityIndicator.get(
            'feedHasActivity',
        )

        // set general settings that are not important for first load
        this.emitMutation({
            pausing: {
                isPaused: {
                    $set: true,
                },
            },
            tooltip: {
                isTooltipEnabled: {
                    $set: await this.dependencies.tooltip.getState(),
                },
            },
            highlights: {
                areHighlightsEnabled: {
                    $set: await this.dependencies.highlights.getState(),
                },
            },
            hasFeedActivity: { $set: activityStatus },
        })
    }

    cleanup() {}

    toggleReadingView: EventHandler<'toggleReadingView'> = async ({
        previousState,
    }) => {
        if (previousState.isWidthLocked) {
            this.resetReadingWidth()
        } else {
            this.setReadingWidth()
        }
    }
    confirmDeletion: EventHandler<'confirmDeletion'> = async ({
        event,
        previousState,
    }) => {
        this.dependencies.setRibbonShouldAutoHide(!event)
        this.emitMutation({
            showConfirmDeletion: { $set: event },
        })
        if (!event) {
            this.dependencies.setRibbonShouldAutoHide(true)
        }
    }
    deletePage: EventHandler<'deletePage'> = async ({
        event,
        previousState,
    }) => {
        const fullURL = window.location.href
        await this.dependencies.searchBG.delPages([normalizeUrl(fullURL)])

        this.emitMutation({
            bookmark: {
                isBookmarked: { $set: false },
                lastBookmarkTimestamp: {
                    $set: null,
                },
            },
        })

        await this.dependencies.bookmarks.setBookmarkStatusInBrowserIcon(
            false,
            fullURL,
        )

        this.dependencies.setRibbonShouldAutoHide(true)
    }
    toggleAskAI: EventHandler<'toggleAskAI'> = async ({
        event,
        previousState,
    }) => {
        await this.dependencies.inPageUI.showSidebar({
            action: 'show_page_summary',
            instaExecutePrompt: event,
        })
    }
    toggleRabbitHole: EventHandler<'toggleRabbitHole'> = async ({
        previousState,
    }) => {
        await this.dependencies.inPageUI.showSidebar({
            action: 'rabbit_hole_open',
        })
    }

    toggleQuickSearch: EventHandler<'toggleQuickSearch'> = async ({}) => {
        this.dependencies.inPageUI.loadOnDemandInPageUI({
            component: 'dashboard',
        })
    }

    toggleTheme: EventHandler<'toggleTheme'> = async ({ previousState }) => {
        await browser.storage.local.set({
            themeVariant:
                previousState.themeVariant === 'dark' ? 'light' : 'dark',
        })
        this.emitMutation({
            themeVariant: {
                $set: previousState.themeVariant === 'dark' ? 'light' : 'dark',
            },
        })
    }

    openPDFinViewer: EventHandler<'openPDFinViewer'> = async ({
        previousState,
    }) => {
        let url
        if (window.location.href.includes('pdfjs/viewer.html?')) {
            url = decodeURIComponent(window.location.href.split('?file=')[1])
            window.open(url, '_self')
        } else {
            this.dependencies.openPDFinViewer(window.location.href)
        }

        // const { runtimeAPI, tabsAPI, pdfIntegrationBG } = this.dependencies
        // const currentPageUrl = window.location.href
        // const [currentTab] = await tabsAPI.query({
        //     active: true,
        //     currentWindow: true,
        // })

        // let nextPageUrl: string
        // if (isUrlPDFViewerUrl(currentPageUrl, { runtimeAPI })) {
        //     nextPageUrl = decodeURIComponent(
        //         currentPageUrl.split('?file=')[1].toString(),
        //     )
        //     await pdfIntegrationBG.doNotOpenPdfViewerForNextPdf()
        // } else {
        //     nextPageUrl = constructPDFViewerUrl(currentPageUrl, {
        //         runtimeAPI,
        //     })
        //     await pdfIntegrationBG.openPdfViewerForNextPdf()
        // }

        // await tabsAPI.update(currentTab.id, { url: nextPageUrl })
        // // this.emitMutation({ currentPageUrl: { $set: nextPageUrl } })
    }

    setReadingWidth = async () => {
        // set member variable for internal logic use
        this.readingView = true

        // set mutation for UI changes
        this.emitMutation({
            isWidthLocked: { $set: true },
        })
        await browser.storage.local.set({ '@Sidebar-reading_view': true })
    }
    resetReadingWidth = async () => {
        // set member variable for internal logic use
        this.readingView = false

        // set mutation for UI changes
        this.emitMutation({
            isWidthLocked: { $set: false },
        })

        // remove listeners and values
        this.tearDownListeners()
        await browser.storage.local.set({ '@Sidebar-reading_view': false })
    }

    setReadingWidthOnListener = (changes: Storage.StorageChange) => {
        if (Object.entries(changes)[0][0] === '@Sidebar-reading_view') {
            this.emitMutation({
                isWidthLocked: { $set: Object.entries(changes)[0][1].newValue },
            })
            this.readingView = Object.entries(changes)[0][1].newValue

            if (Object.entries(changes)[0][1].newValue) {
                this.emitMutation({
                    isWidthLocked: { $set: true },
                })
            }

            if (!Object.entries(changes)[0][1].newValue) {
                this.emitMutation({
                    isWidthLocked: { $set: false },
                })
            }
        }
    }

    tearDownListeners() {
        browser.storage.onChanged.removeListener((changes) => {
            this.setReadingWidthOnListener(changes)
        })
        // this.resizeObserver.disconnect()
    }

    /**
     * This exists due to a race-condition between bookmark shortcut and init hydration logic.
     * Having this ensures any event handler can wait until the init logic is taken care and also
     * receive any state changes that happen during that wait.
     */
    private async waitForPostInitState(
        initState: RibbonContainerState,
    ): Promise<RibbonContainerState> {
        let latestState = { ...initState }

        const stateUpdater = (mutation: UIMutation<RibbonContainerState>) => {
            latestState = this.withMutation(latestState, mutation)
        }

        this.events.on('mutation', stateUpdater)
        await this.initLogicResolvable
        this.events.removeListener('mutation', stateUpdater)

        return latestState
    }

    toggleFeed: EventHandler<'toggleFeed'> = async ({ previousState }) => {
        this.dependencies.setRibbonShouldAutoHide(previousState.showFeed)
        const mutation: UIMutation<RibbonContainerState> = {
            showFeed: { $set: !previousState.showFeed },
            areExtraButtonsShown: { $set: false },
            showRemoveMenu: { $set: false },
            areTutorialShown: { $set: false },
        }

        if (!previousState.showFeed) {
            mutation.commentBox = { showCommentBox: { $set: false } }
            mutation.lists = { showListsPicker: { $set: false } }
            this.emitMutation(mutation)
            await this.dependencies.activityIndicatorBG.markActivitiesAsSeen()
        } else {
            this.emitMutation(mutation)
        }
    }

    setWriteError: EventHandler<'setWriteError'> = async ({ event }) => {
        this.emitMutation({
            bookmark: { writeError: { $set: event.error } },
        })
    }
    setTutorialId: EventHandler<'setTutorialId'> = async ({ event }) => {
        this.emitMutation({
            tutorialIdToOpen: { $set: event.tutorialIdToOpen },
        })

        if (event.tutorialIdToOpen != null) {
            this.dependencies.setRibbonShouldAutoHide(false)
        } else {
            this.dependencies.setRibbonShouldAutoHide(true)
        }
    }

    toggleShowExtraButtons: EventHandler<'toggleShowExtraButtons'> = ({
        previousState,
    }) => {
        this.dependencies.setRibbonShouldAutoHide(
            previousState.areExtraButtonsShown,
        )
        const mutation: UIMutation<RibbonContainerState> = {
            areExtraButtonsShown: { $set: !previousState.areExtraButtonsShown },
            areTutorialShown: { $set: false },
            showFeed: { $set: false },
        }

        if (!previousState.areExtraButtonsShown) {
            mutation.commentBox = { showCommentBox: { $set: false } }
            mutation.lists = { showListsPicker: { $set: false } }
        }

        this.emitMutation(mutation)
    }
    toggleRemoveMenu: EventHandler<'toggleRemoveMenu'> = ({
        previousState,
        event,
    }) => {
        this.dependencies.setRibbonShouldAutoHide(previousState.showRemoveMenu)
        const mutation: UIMutation<RibbonContainerState> = {
            showRemoveMenu: {
                $set: event != null ? event : !previousState.showRemoveMenu,
            },
            areExtraButtonsShown: { $set: false },
            areTutorialShown: { $set: false },
            showFeed: { $set: false },
        }

        if (!previousState.showRemoveMenu) {
            mutation.commentBox = { showCommentBox: { $set: false } }
            mutation.lists = { showListsPicker: { $set: false } }
        }

        this.emitMutation(mutation)
    }

    toggleShowTutorial: EventHandler<'toggleShowTutorial'> = ({
        previousState,
    }) => {
        this.dependencies.setRibbonShouldAutoHide(
            previousState.areTutorialShown,
        )
        const mutation: UIMutation<RibbonContainerState> = {
            areTutorialShown: { $set: !previousState.areTutorialShown },
            areExtraButtonsShown: { $set: false },
            showRemoveMenu: { $set: false },
            showFeed: { $set: false },
        }

        if (!previousState.areTutorialShown) {
            mutation.commentBox = { showCommentBox: { $set: false } }
            mutation.lists = { showListsPicker: { $set: false } }
        }

        this.emitMutation(mutation)
    }

    toggleRibbon: EventHandler<'toggleRibbon'> = async ({ previousState }) => {
        const shouldBeEnabled = !previousState.isRibbonEnabled
        this.emitMutation({ isRibbonEnabled: { $set: shouldBeEnabled } })
        await this.dependencies.setSidebarEnabled(shouldBeEnabled)
        if (!shouldBeEnabled) {
            this.dependencies.inPageUI.removeRibbon()
        }
    }

    //
    // Bookmark
    //
    toggleBookmark: EventHandler<'toggleBookmark'> = async ({
        previousState,
    }) => {
        const isAllowed = await pageActionAllowed(
            this.dependencies.browserAPIs,
            this.dependencies.analyticsBG,
            this.dependencies.customLists,
            previousState.fullPageUrl,
            false,
        )

        if (!isAllowed) {
            this.dependencies.events.emit('showPowerUpModal', {
                limitReachedNotif: 'Bookmarks',
            })

            return
        }

        await executeUITask(
            this,
            (state) => ({ bookmark: { loadState: { $set: state } } }),
            async () => {
                const postInitState = await this.waitForPostInitState(
                    previousState,
                )

                const updateState = (isBookmarked: boolean) =>
                    this.emitMutation({
                        bookmark: {
                            isBookmarked: { $set: isBookmarked },
                            lastBookmarkTimestamp: {
                                $set: Math.floor(Date.now() / 1000),
                            },
                        },
                    })

                const shouldBeBookmarked = !postInitState.bookmark.isBookmarked

                let title: string = document.title

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

                try {
                    if (shouldBeBookmarked) {
                        updateState(shouldBeBookmarked)
                        await this.dependencies.bookmarks.addPageBookmark({
                            fullUrl: postInitState.fullPageUrl,
                            tabId: this.dependencies.currentTab.id,
                            metaData: {
                                pageTitle: title,
                            },
                        })
                        await this.dependencies.bookmarks.setBookmarkStatusInBrowserIcon(
                            true,
                            postInitState.fullPageUrl,
                        )
                    }
                } catch (err) {
                    updateState(!shouldBeBookmarked)
                    this.emitMutation({
                        bookmark: { writeError: { $set: err.message } },
                    })
                    throw err
                }
            },
        )
    }

    //
    // Comment box
    //
    setShowCommentBox: EventHandler<'setShowCommentBox'> = async ({
        event,
    }) => {
        await this.initLogicResolvable
        this.dependencies.setRibbonShouldAutoHide(!event.value)

        const extra: UIMutation<RibbonContainerState> =
            event.value === true
                ? {
                      lists: { showListsPicker: { $set: false } },
                      search: { showSearchBox: { $set: false } },
                      areExtraButtonsShown: { $set: false },
                      showRemoveMenu: { $set: false },
                      areTutorialShown: { $set: false },
                      showFeed: { $set: false },
                  }
                : {}

        this.emitMutation({
            commentBox: { showCommentBox: { $set: event.value } },
            ...extra,
        })

        if (event.value) {
            this.dependencies.focusCreateForm()
        }
    }

    saveComment: EventHandler<'saveComment'> = async ({
        event: { shouldShare, isProtected },
        previousState: { fullPageUrl, commentBox },
    }) => {
        const comment = commentBox.commentText.trim()
        if (comment.length === 0) {
            return
        }

        this.emitMutation({ commentBox: { showCommentBox: { $set: false } } })

        const localAnnotationId = generateAnnotationUrl({
            pageUrl: fullPageUrl,
            now: () => Date.now(),
        })

        this.emitMutation({
            commentBox: {
                $set: {
                    ...INITIAL_RIBBON_COMMENT_BOX_STATE,
                    isCommentSaved: true,
                },
            },
        })
        const now = Date.now()

        const { remoteAnnotationId, savePromise } = await createAnnotation({
            annotationsBG: this.dependencies.annotations,
            contentSharingBG: this.dependencies.contentSharing,
            annotationData: {
                comment,
                fullPageUrl,
                localId: localAnnotationId,
                createdWhen: new Date(now),
            },
            syncSettingsBG: this.dependencies.syncSettingsBG,
        })
        this.dependencies.annotationsCache.addAnnotation({
            localId: localAnnotationId,
            remoteId: remoteAnnotationId ?? undefined,
            comment,
            normalizedPageUrl: normalizeUrl(fullPageUrl),
            unifiedListIds: [],
            lastEdited: now,
            createdWhen: now,
            localListIds: commentBox.lists,
            creator: this.dependencies.currentUser,
            privacyLevel: shareOptsToPrivacyLvl({
                shouldShare,
                isBulkShareProtected: isProtected,
            }),
        })
        this.dependencies.setRibbonShouldAutoHide(true)

        await Promise.all([
            new Promise((resolve) =>
                setTimeout(resolve, this.commentSavedTimeout),
            ),
            savePromise,
        ])
        this.emitMutation({ commentBox: { isCommentSaved: { $set: false } } })
    }

    cancelComment: EventHandler<'cancelComment'> = () => {
        this.dependencies.setRibbonShouldAutoHide(true)

        this.emitMutation({
            commentBox: { $set: INITIAL_RIBBON_COMMENT_BOX_STATE },
        })
    }

    changeComment: EventHandler<'changeComment'> = ({ event }) => {
        this.emitMutation({
            commentBox: { commentText: { $set: event.value } },
        })
    }

    updateCommentBoxTags: EventHandler<'updateCommentBoxTags'> = ({
        event,
    }) => {
        this.emitMutation({ commentBox: { tags: { $set: event.value } } })
    }

    updateCommentBoxLists: EventHandler<'updateCommentBoxLists'> = ({
        event,
    }) => {
        this.emitMutation({ commentBox: { lists: { $set: event.value } } })
    }

    //
    // Lists
    //
    updateLists: EventHandler<'updateLists'> = async ({
        previousState,
        event,
    }) => {
        const pageListsSet = new Set(previousState.lists.pageListIds)
        if (event.value.added != null) {
            pageListsSet.add(event.value.added)
        } else {
            pageListsSet.delete(event.value.deleted)
        }
        this.emitMutation({
            lists: { pageListIds: { $set: [...pageListsSet] } },
            bookmark: {
                isBookmarked: { $set: true },
                lastBookmarkTimestamp: {
                    $set: Math.floor(Date.now() / 1000),
                },
            },
        })

        const { annotationsCache } = this.dependencies
        const unifiedListIds = [...pageListsSet]
            .map(
                (localListId) =>
                    annotationsCache.getListByLocalId(localListId)?.unifiedId,
            )
            .filter((id) => id != null)
        annotationsCache.setPageData(
            normalizeUrl(previousState.fullPageUrl),
            unifiedListIds,
        )

        let title: string

        if (window.location.href.includes('web.telegram.org')) {
            title = getTelegramUserDisplayName(document, window.location.href)
        }

        if (
            window.location.href.includes('x.com/messages/') ||
            window.location.href.includes('twitter.com/messages/')
        ) {
            title = document.title
        }

        try {
            await this.dependencies.customLists.updateListForPage({
                added: event.value.added,
                deleted: event.value.deleted,
                url: previousState.fullPageUrl,
                tabId: this.dependencies.currentTab.id,
                skipPageIndexing: event.value.skipPageIndexing,
                pageTitle: title,
            })
        } catch (err) {
            this.emitMutation({
                lists: {
                    pageListIds: {
                        $set: [...previousState.lists.pageListIds],
                    },
                },
                bookmark: {
                    isBookmarked: {
                        $set: previousState.bookmark.isBookmarked,
                    },
                    lastBookmarkTimestamp: {
                        $set: previousState.bookmark.lastBookmarkTimestamp,
                    },
                },
            })
            throw err
        }
    }

    listAllTabs: EventHandler<'listAllTabs'> = ({ event }) => {
        return this.dependencies.customLists.addOpenTabsToList({
            listId: event.value,
        })
    }

    setShowListsPicker: EventHandler<'setShowListsPicker'> = async ({
        event,
    }) => {
        await this.initLogicResolvable

        await sleepPromise(80)
        this.dependencies.setRibbonShouldAutoHide(!event.value)
        const extra: UIMutation<RibbonContainerState> =
            event.value === true
                ? {
                      commentBox: { showCommentBox: { $set: false } },
                      search: { showSearchBox: { $set: false } },
                      areExtraButtonsShown: { $set: false },
                      showRemoveMenu: { $set: false },
                      areTutorialShown: { $set: false },
                      showFeed: { $set: false },
                  }
                : {}

        return { lists: { showListsPicker: { $set: event.value } }, ...extra }
    }
    //
    // Search
    //
    setShowSearchBox: EventHandler<'setShowSearchBox'> = ({ event }) => {
        this.dependencies.setRibbonShouldAutoHide(!event.value)
        const extra: UIMutation<RibbonContainerState> =
            event.value === true
                ? {
                      commentBox: { showCommentBox: { $set: false } },
                      lists: { showListsPicker: { $set: false } },
                      areExtraButtonsShown: { $set: false },
                      showRemoveMenu: { $set: false },
                      areTutorialShown: { $set: false },
                  }
                : {}

        return { search: { showSearchBox: { $set: event.value } }, ...extra }
    }

    setSearchValue: EventHandler<'setSearchValue'> = ({ event }) => {
        return { search: { searchValue: { $set: event.value } } }
    }

    //
    // Pausing
    //
    handlePauseToggle: EventHandler<'handlePauseToggle'> = async ({
        event,
        previousState,
    }) => {
        const toggleState = () =>
            this.emitMutation({
                pausing: { isPaused: { $apply: (prev) => !prev } },
            })

        toggleState()

        try {
            // await this.dependencies.activityLogger.toggleLoggingPause()
        } catch (err) {
            toggleState()
            throw err
        }
    }

    //
    // Tooltip
    //
    handleTooltipToggle: EventHandler<'handleTooltipToggle'> = async ({}) => {
        const currentSetting = await this.dependencies.tooltip.getState()
        const setState = (state: boolean) =>
            this.emitMutation({
                tooltip: { isTooltipEnabled: { $set: state } },
            })

        setState(!currentSetting)

        try {
            if (currentSetting === true) {
                await this.dependencies.inPageUI.removeTooltip()
            } else {
                await this.dependencies.inPageUI.showTooltip()
            }
            await this.dependencies.tooltip.setState(!currentSetting)
        } catch (err) {
            setState(!currentSetting)
            throw err
        }
    }

    handleHighlightsToggle: EventHandler<'handleHighlightsToggle'> = async ({
        previousState,
    }) => {
        const currentSetting = await this.dependencies.highlights.getState()
        const setState = (state: boolean) => {
            this.emitMutation({
                highlights: { areHighlightsEnabled: { $set: state } },
            })
        }

        setState(!currentSetting)

        try {
            if (previousState.highlights.areHighlightsEnabled) {
                await this.dependencies.inPageUI.hideHighlights()
            } else {
                await this.dependencies.inPageUI.showHighlights()
            }

            await this.dependencies.highlights.setState(!currentSetting)
        } catch (err) {
            setState(!currentSetting)
            throw err
        }
    }
}
