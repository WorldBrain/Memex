import 'core-js'
import hexToRgb from 'hex-to-rgb'
import { EventEmitter } from 'events'
import type { ContentIdentifier } from '@worldbrain/memex-common/lib/page-indexing/types'
import { injectMemexExtDetectionEl } from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import {
    MemexOpenLinkDetail,
    MemexRequestHandledDetail,
    MEMEX_OPEN_LINK_EVENT_NAME,
    MEMEX_REQUEST_HANDLED_EVENT_NAME,
} from '@worldbrain/memex-common/lib/services/memex-extension'

// import { setupScrollReporter } from 'src/activity-logger/content_script'
import { setupPageContentRPC } from 'src/page-analysis/content_script'
import { shouldIncludeSearchInjection } from 'src/search-injection/detection'
import {
    remoteFunction,
    runInBackground,
    RemoteFunctionRegistry,
    makeRemotelyCallableType,
    setupRpcConnection,
} from 'src/util/webextensionRPC'
import { Resolvable, resolvablePromise } from 'src/util/resolvable'
import type { ContentScriptRegistry, GetContentFingerprints } from './types'
import type { ContentScriptsInterface } from '../background/types'
import type { ContentScriptComponent } from '../types'
import {
    initKeyboardShortcuts,
    resetKeyboardShortcuts,
} from 'src/in-page-ui/keyboard-shortcuts/content_script'
import type { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import type { RemoteTagsInterface } from 'src/tags/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import ToolbarNotifications from 'src/toolbar-notification/content_script'
import * as tooltipUtils from 'src/in-page-ui/tooltip/utils'
import * as sidebarUtils from 'src/sidebar-overlay/utils'
import * as constants from '../constants'
import { SharedInPageUIState } from 'src/in-page-ui/shared-state/shared-in-page-ui-state'
import type { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { PageAnnotationsCache } from 'src/annotations/cache'
import type { AnalyticsEvent } from 'src/analytics/types'
import analytics from 'src/analytics'
import { main as highlightMain } from 'src/content-scripts/content_script/highlights'
import { main as searchInjectionMain } from 'src/content-scripts/content_script/search-injection'
import type { PageIndexingInterface } from 'src/page-indexing/background/types'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { getUnderlyingResourceUrl } from 'src/util/uri-utils'
import {
    bookmarks,
    copyPaster,
    subscription,
} from 'src/util/remote-functions-background'
import { ContentLocatorFormat } from '../../../external/@worldbrain/memex-common/ts/personal-cloud/storage/types'
import { setupPdfViewerListeners } from './pdf-detection'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { RemoteBGScriptInterface } from 'src/background-script/types'
import { createSyncSettingsStore } from 'src/sync-settings/util'
import { checkPageBlacklisted } from 'src/blacklist/utils'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import { runtime } from 'webextension-polyfill'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { hydrateCacheForPageAnnotations } from 'src/annotations/cache/utils'
import type {
    ContentSharingInterface,
    RemoteContentSharingByTabsInterface,
} from 'src/content-sharing/background/types'
import { UNDO_HISTORY } from 'src/constants'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { isUrlPDFViewerUrl } from 'src/pdf/util'
import { isMemexPageAPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import type { SummarizationInterface } from 'src/summarization-llm/background'
import { pageActionAllowed, upgradePlan } from 'src/util/subscriptions/storage'
import { sleepPromise } from 'src/util/promises'
import { browser } from 'webextension-polyfill-ts'
import initSentry, { captureException } from 'src/util/raven'
import { HIGHLIGHT_COLOR_KEY } from 'src/highlighting/constants'
import { DEFAULT_HIGHLIGHT_COLOR } from '@worldbrain/memex-common/lib/annotations/constants'
import { createAnnotation } from 'src/annotations/annotation-save-logic'
import { generateAnnotationUrl } from 'src/annotations/utils'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { HighlightRenderer } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/renderer'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import checkBrowser from 'src/util/check-browser'
import { getHTML5VideoTimestamp } from '@worldbrain/memex-common/lib/editor/utils'
import { getTelegramUserDisplayName } from '@worldbrain/memex-common/lib/telegram/utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { UnifiedList } from 'src/annotations/cache/types'
import {
    trackAnnotationCreate,
    trackPageActivityIndicatorHit,
} from '@worldbrain/memex-common/lib/analytics/events'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { PkmSyncInterface } from 'src/pkm-integrations/background/types'
import { promptPdfScreenshot } from '@worldbrain/memex-common/lib/pdf/screenshots/selection'
import { processCommentForImageUpload } from '@worldbrain/memex-common/lib/annotations/processCommentForImageUpload'

// Content Scripts are separate bundles of javascript code that can be loaded
// on demand by the browser, as needed. This main function manages the initialisation
// and dependencies of content scripts.

export async function main(
    params: {
        loadRemotely?: boolean
        getContentFingerprints?: GetContentFingerprints
    } = {},
): Promise<SharedInPageUIState> {
    const isRunningInFirefox = checkBrowser() === 'firefox'
    if (!isRunningInFirefox) {
        initSentry({})
    }
    params.loadRemotely = params.loadRemotely ?? true

    const isPdfViewerRunning = params.getContentFingerprints != null
    if (isPdfViewerRunning) {
        setupPdfViewerListeners({
            onLoadError: () =>
                bgScriptBG.openOverviewTab({
                    openInSameTab: true,
                    missingPdf: true,
                }),
        })
    } else {
        injectMemexExtDetectionEl()
    }

    let keysPressed = []

    document.addEventListener('keydown', (event) => {
        undoAnnotationHistory(event)
    })

    document.addEventListener('keyup', (event) => {
        keysPressed.filter((item) => item != event.key)
    })

    const undoAnnotationHistory = async (event) => {
        if (
            event.target.nodeName === 'INPUT' ||
            event.target.nodeName === 'TEXTAREA'
        ) {
            return
        }

        if (event.key === 'Meta') {
            keysPressed.push(event.key)
        }
        if (event.key === 'z') {
            if (keysPressed.includes('Meta')) {
                let lastActions = await globalThis['browser'].storage.local.get(
                    `${UNDO_HISTORY}`,
                )

                lastActions = lastActions[`${UNDO_HISTORY}`]

                let lastAction = lastActions[0]

                if (lastAction.url !== window.location.href) {
                    await globalThis['browser'].storage.local.remove([
                        `${UNDO_HISTORY}`,
                    ])
                    return
                } else {
                    await highlightRenderer.removeAnnotationHighlight({
                        id: lastAction.id,
                    })
                    lastActions.shift()
                    await globalThis['browser'].storage.local.set({
                        [`${UNDO_HISTORY}`]: lastActions,
                    })
                }

                const existing =
                    annotationsCache.annotations.byId[lastAction.id]
                annotationsCache.removeAnnotation({
                    unifiedId: existing.unifiedId,
                })

                if (existing?.localId != null) {
                    await annotationsBG.deleteAnnotation(existing.localId)
                }
            }
        }
    }

    setupRpcConnection({ sideName: 'content-script-global', role: 'content' })
    setupPageContentRPC()

    const pageInfo = new PageInfo(params)

    // 1. Create a local object with promises to track each content script
    // initialisation and provide a function which can initialise a content script
    // or ignore if already loaded.
    const components: {
        ribbon?: Resolvable<void>
        sidebar?: Resolvable<void>
        tooltip?: Resolvable<void>
        highlights?: Resolvable<void>
    } = {}

    // 2. Initialise dependencies required by content scripts
    const analyticsBG = runInBackground<AnalyticsCoreInterface>()
    const authBG = runInBackground<AuthRemoteFunctionsInterface>()
    const bgScriptBG = runInBackground<RemoteBGScriptInterface>()
    const pkmSyncBG = runInBackground<PkmSyncInterface>()
    const summarizeBG = runInBackground<SummarizationInterface<'caller'>>()
    const annotationsBG = runInBackground<AnnotationInterface<'caller'>>()
    const pageIndexingBG = runInBackground<PageIndexingInterface<'caller'>>()
    const contentSharingBG = runInBackground<ContentSharingInterface>()
    const imageSupport = runInBackground()
    const contentSharingByTabsBG = runInBackground<
        RemoteContentSharingByTabsInterface<'caller'>
    >()
    const tagsBG = runInBackground<RemoteTagsInterface>()
    const contentScriptsBG = runInBackground<
        ContentScriptsInterface<'caller'>
    >()
    const syncSettingsBG = runInBackground<RemoteSyncSettingsInterface>()
    const collectionsBG = runInBackground<RemoteCollectionsInterface>()
    const pageActivityIndicatorBG = runInBackground<
        RemotePageActivityIndicatorInterface
    >()
    const remoteFunctionRegistry = new RemoteFunctionRegistry()
    const annotationsManager = new AnnotationsManager()
    const toolbarNotifications = new ToolbarNotifications()
    toolbarNotifications.registerRemoteFunctions(remoteFunctionRegistry)

    // 2.5 load cache

    const _currentUser = await authBG.getCurrentUser()
    const currentUser: UserReference = _currentUser
        ? { type: 'user-reference', id: _currentUser.id }
        : null
    const fullPageUrl = await pageInfo.getFullPageUrl()
    const annotationsCache = new PageAnnotationsCache({})
    window['__annotationsCache'] = annotationsCache

    const loadCacheDataPromise = hydrateCacheForPageAnnotations({
        fullPageUrl,
        user: currentUser,
        cache: annotationsCache,
        bgModules: {
            annotations: annotationsBG,
            customLists: collectionsBG,
            contentSharing: contentSharingBG,
            pageActivityIndicator: pageActivityIndicatorBG,
        },
    })

    const highlightRenderer = new HighlightRenderer({
        captureException,
        getUndoHistory: async () => {
            const storage = await browser.storage.local.get(UNDO_HISTORY)
            return storage[UNDO_HISTORY] ?? []
        },
        setUndoHistory: async (undoHistory) =>
            browser.storage.local.set({
                [UNDO_HISTORY]: undoHistory,
            }),
        getHighlightColorRGB: async () => {
            const storage = await browser.storage.local.get(HIGHLIGHT_COLOR_KEY)
            return hexToRgb(
                storage[HIGHLIGHT_COLOR_KEY] ?? DEFAULT_HIGHLIGHT_COLOR,
            )
        },
        onHighlightColorChange: (cb) => {
            browser.storage.onChanged.addListener((changes) => {
                if (changes[HIGHLIGHT_COLOR_KEY]?.newValue != null) {
                    cb(changes[HIGHLIGHT_COLOR_KEY].newValue)
                }
            })
        },
        rollbackAnnotationCreation: (unifiedAnnotationId) => {
            annotationsCache.removeAnnotation({
                unifiedId: unifiedAnnotationId.toString(),
            })
        },
        scheduleAnnotationCreation: async (data) => {
            const localId = generateAnnotationUrl({
                pageUrl: data.fullPageUrl,
                now: () => data.createdWhen,
            })

            const localListIds: number[] = []
            const remoteListIds: string[] = []
            const unifiedListIds: UnifiedList['unifiedId'][] = []
            if (inPageUI.selectedList) {
                const selectedList =
                    annotationsCache.lists.byId[inPageUI.selectedList]
                if (selectedList.localId != null) {
                    localListIds.push(selectedList.localId)
                }
                if (selectedList.remoteId != null) {
                    remoteListIds.push(selectedList.remoteId)
                }
                unifiedListIds.push(selectedList.unifiedId)
            }

            let privacyLevel: AnnotationPrivacyLevels
            if (remoteListIds.length) {
                privacyLevel = data.shouldShare
                    ? AnnotationPrivacyLevels.SHARED
                    : AnnotationPrivacyLevels.PROTECTED
            } else {
                privacyLevel = data.shouldShare
                    ? AnnotationPrivacyLevels.SHARED
                    : AnnotationPrivacyLevels.PRIVATE
            }

            const { unifiedId } = annotationsCache.addAnnotation({
                localId,
                privacyLevel,
                localListIds: [],
                unifiedListIds,
                body: data.body,
                comment: data.comment,
                creator: data.creator,
                selector: data.selector,
                lastEdited: data.updatedWhen,
                createdWhen: data.createdWhen,
                normalizedPageUrl: normalizeUrl(data.fullPageUrl),
            })

            const createPromise = (async () => {
                const bodyForSaving = await processCommentForImageUpload(
                    data.body,
                    data.fullPageUrl,
                    localId,
                    imageSupport,
                    false,
                )

                const {
                    savePromise,
                    remoteAnnotationId,
                } = await createAnnotation({
                    shareOpts: {
                        shouldShare:
                            remoteListIds.length > 0 || data.shouldShare,
                        shouldCopyShareLink: data.shouldShare,
                    },
                    annotationsBG,
                    contentSharingBG,
                    pkmSyncBG: pkmSyncBG,
                    skipPageIndexing: false,
                    syncSettingsBG: syncSettingsBG,
                    privacyLevelOverride: privacyLevel,
                    annotationData: {
                        localId,
                        localListIds,
                        body: bodyForSaving,
                        comment: data.comment,
                        selector: data.selector,
                        fullPageUrl: data.fullPageUrl,
                        pageTitle: pageInfo.getPageTitle(),
                        createdWhen: new Date(data.createdWhen),
                    },
                })

                if (remoteAnnotationId != null) {
                    const cachedAnnotation =
                        annotationsCache.annotations.byId[unifiedId]
                    annotationsCache.updateAnnotation({
                        unifiedId,
                        remoteId: remoteAnnotationId,
                        privacyLevel: cachedAnnotation.privacyLevel,
                        unifiedListIds: cachedAnnotation.unifiedListIds,
                    })
                }
                await savePromise
            })()
            return {
                annotationId: unifiedId as AutoPk,
                localId: localId,
                createPromise,
            }
        },
    })

    const sidebarEvents = new EventEmitter() as AnnotationsSidebarInPageEventEmitter

    const isSidebarEnabled =
        (await sidebarUtils.getSidebarState()) &&
        (pageInfo.isPdf ? isPdfViewerRunning : true)

    // 3. Creates an instance of the InPageUI manager class to encapsulate
    // business logic of initialising and hide/showing components.
    const inPageUI = new SharedInPageUIState({
        getNormalizedPageUrl: pageInfo.getNormalizedPageUrl,
        loadComponent: (component) => {
            // Treat highlights differently as they're not a separate content script
            if (component === 'highlights') {
                components.highlights = resolvablePromise<void>()
                components.highlights.resolve()
            }

            if (!components[component]) {
                components[component] = resolvablePromise<void>()
                loadContentScript(component)
            }
            return components[component]!
        },
        unloadComponent: (component) => {
            delete components[component]
        },
    })

    await loadCacheDataPromise
        .then(inPageUI.cacheLoadPromise.resolve)
        .catch(inPageUI.cacheLoadPromise.reject)

    const pageHasBookark =
        (await bookmarks.pageHasBookmark(fullPageUrl)) ||
        (await collectionsBG
            .fetchPageLists({ url: fullPageUrl })
            .then((lists) => lists.length > 0)) ||
        (await annotationsBG
            .getAllAnnotationsByUrl({ url: fullPageUrl })
            .then((annotations) => annotations.length > 0))
    await bookmarks.setBookmarkStatusInBrowserIcon(pageHasBookark, fullPageUrl)

    async function saveHighlight(
        shouldShare: boolean,
        screenshotAnchor?,
        screenshotImage?,
        imageSupport?,
    ): Promise<AutoPk> {
        let highlightId: AutoPk
        try {
            highlightId = await highlightRenderer.saveAndRenderHighlight({
                currentUser,
                onClick: ({ annotationId, openInEdit }) =>
                    inPageUI.showSidebar({
                        annotationCacheId: annotationId.toString(),
                        action: openInEdit
                            ? 'edit_annotation'
                            : 'show_annotation',
                    }),
                getSelection: () => document.getSelection(),
                getFullPageUrl: async () => pageInfo.getFullPageUrl(),
                isPdf: pageInfo.isPdf,
                shouldShare,
                screenshotAnchor,
                screenshotImage,
                imageSupport,
            })
        } catch (err) {
            captureException(err)
            await inPageUI.toggleErrorMessage({ type: 'annotation' })
            throw err
        }
        return highlightId
    }

    const annotationsFunctions = {
        createHighlight: (
            analyticsEvent?: AnalyticsEvent<'Highlights'>,
        ) => async (selection: Selection, shouldShare: boolean) => {
            if (!(await pageActionAllowed(analyticsBG))) {
                return
            }
            let screenshotGrabResult
            if (
                window.location.href.endsWith('.pdf') &&
                window.getSelection().toString().length === 0
            ) {
                console.log('test1')
                screenshotGrabResult = await promptPdfScreenshot()
                console.log('test2')

                if (
                    screenshotGrabResult == null ||
                    screenshotGrabResult.anchor == null
                ) {
                    return
                }

                await saveHighlight(
                    shouldShare,
                    screenshotGrabResult.anchor,
                    screenshotGrabResult.screenshot,
                    imageSupport,
                )
            } else {
                await saveHighlight(shouldShare)
            }

            if (inPageUI.componentsShown.sidebar) {
                inPageUI.showSidebar({
                    action: 'show_annotation',
                })
            }
            await inPageUI.hideTooltip()
            if (analyticsBG) {
                try {
                    trackAnnotationCreate(analyticsBG, {
                        annotationType: 'highlight',
                    })
                } catch (error) {
                    console.error(
                        `Error tracking space create event', ${error}`,
                    )
                }
            }
        },
        createAnnotation: (
            analyticsEvent?: AnalyticsEvent<'Annotations'>,
        ) => async (
            selection: Selection,
            shouldShare: boolean,
            showSpacePicker?: boolean,
            commentText?: string,
            includeLastFewSecs?: number,
        ) => {
            if (!(await pageActionAllowed(analyticsBG))) {
                return
            }

            if (selection && window.getSelection().toString().length > 0) {
                const annotationId = await saveHighlight(shouldShare)
                await inPageUI.showSidebar(
                    annotationId
                        ? {
                              annotationCacheId: annotationId.toString(),
                              action: showSpacePicker
                                  ? 'edit_annotation_spaces'
                                  : 'edit_annotation',
                          }
                        : {
                              action: 'comment',
                              commentText: commentText ?? '',
                          },
                )
            } else {
                await inPageUI.showSidebar({
                    action: 'youtube_timestamp',
                    commentText: commentText,
                })
            }

            await inPageUI.hideTooltip()
            if (analyticsBG) {
                // tracking highlight here too bc I determine annotations by them having content added, tracked elsewhere
                try {
                    trackAnnotationCreate(analyticsBG, {
                        annotationType: 'highlight',
                    })
                } catch (error) {
                    console.error(
                        `Error tracking space create event', ${error}`,
                    )
                }
            }
        },
        askAI: () => (highlightedText: string) => {
            inPageUI.showSidebar({
                action: 'show_page_summary',
                highlightedText,
            })
            inPageUI.hideTooltip()
        },
        createTimestampWithAISummary: async (includeLastFewSecs) => {
            const timestampToPass = await getTimestampedNoteWithAIsummaryForYoutubeNotes(
                includeLastFewSecs,
            )

            if (timestampToPass === null) {
                const aIbutton = document.getElementById(
                    'AItimeStampButtonInner',
                )
                aIbutton.innerHTML = `<div class="ytp-menuitem-label" id="AItimeStampButtonInner" style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">No Transcript Available</div>`
                return
            }

            inPageUI.showSidebar({
                action: 'create_youtube_timestamp_with_AI_summary',
                timeStampANDSummaryJSON: timestampToPass,
            })
            inPageUI.hideTooltip()
        },
        createTimestampWithScreenshot: async () => {
            const screenshotButton = document.getElementById(
                'screenshotButtonInner',
            )

            screenshotButton.innerHTML = `<div class="ytp-menuitem-label" id="screenshotButtonInner" style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Loading Screenshot</div>`
            const targetContainer = document.getElementById('movie_player')
            const screenshotTarget = targetContainer.getElementsByClassName(
                'html5-main-video',
            )[0] as HTMLElement

            if (screenshotTarget) {
                const dataURL = await captureScreenshot(screenshotTarget)
                inPageUI.showSidebar({
                    action: 'create_youtube_timestamp_with_screenshot',
                    imageData: dataURL,
                })
            }

            screenshotButton.innerHTML = `<div class="ytp-menuitem-label" id="screenshotButtonInner" style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Screenshot</div>`

            inPageUI.hideTooltip()
        },
    }

    async function captureScreenshot(screenshotTarget) {
        let canvas = document.createElement('canvas')
        let height = screenshotTarget.offsetHeight
        let width = screenshotTarget.offsetWidth

        canvas.width = width
        canvas.height = height

        let ctx = canvas.getContext('2d')

        ctx.drawImage(screenshotTarget, 0, 0, canvas.width, canvas.height)

        let image = canvas.toDataURL('image/jpeg')

        return image
    }

    // if (window.location.hostname === 'www.youtube.com') {
    //     injectYoutubeButtonMenu(annotationsFunctions)
    //     injectYoutubeContextMenu(annotationsFunctions)
    // }

    if (fullPageUrl === 'https://memex.garden/upgradeSuccessful') {
        const isStaging =
            process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
            process.env.NODE_ENV === 'development'
        const email = _currentUser.email

        const baseUrl = isStaging
            ? 'https://cloudflare-memex-staging.memex.workers.dev'
            : 'https://cloudfare-memex.memex.workers.dev'
        const url = `${baseUrl}` + '/stripe-subscriptions'

        const response = await fetch(url, {
            method: 'POST',
            headers: {},
            body: JSON.stringify({
                email,
            }),
        })

        const isSubscribed = await response.json()
        const pageLimit = isSubscribed.planLimit
        const AIlimit = isSubscribed.aiQueries

        if (
            isSubscribed.status === 'active' ||
            isSubscribed.status === 'already-setup'
        ) {
            await upgradePlan(pageLimit, AIlimit)
        }
    }
    if (
        fullPageUrl === 'https://memex.garden/upgradeStaging' ||
        fullPageUrl === 'https://memex.garden/upgradeNotification' ||
        fullPageUrl === 'https://memex.garden/upgrade' ||
        fullPageUrl.startsWith('https://memex.garden/') ||
        fullPageUrl === 'https://memex.garden/copilot' ||
        fullPageUrl === 'https://memex.garden/hivemind'
    ) {
        setInterval(() => {
            const elements = document.querySelectorAll('#UpgradeButton')

            for (let element of elements) {
                const currentHref = element.getAttribute('href')
                if (!currentHref.includes('prefilled_email')) {
                    element.setAttribute(
                        'href',
                        `${currentHref}?prefilled_email=${_currentUser.email}`,
                    )
                }
            }
        }, 200)
    }

    // 4. Create a contentScriptRegistry object with functions for each content script
    // component, that when run, initialise the respective component with its
    // dependencies
    const contentScriptRegistry: ContentScriptRegistry = {
        async registerRibbonScript(execute): Promise<void> {
            await execute({
                inPageUI,
                currentUser,
                annotationsManager,
                highlighter: highlightRenderer,
                annotations: annotationsBG,
                annotationsCache,
                tags: tagsBG,
                customLists: collectionsBG,
                authBG,
                bgScriptBG,
                analyticsBG,
                pageActivityIndicatorBG,
                activityIndicatorBG: runInBackground(),
                contentSharing: contentSharingBG,
                bookmarks,
                syncSettingsBG: syncSettingsBG,
                syncSettings: createSyncSettingsStore({ syncSettingsBG }),
                tooltip: {
                    getState: tooltipUtils.getTooltipState,
                    setState: tooltipUtils.setTooltipState,
                },
                highlights: {
                    getState: tooltipUtils.getHighlightsState,
                    setState: tooltipUtils.setHighlightsState,
                },
                getFullPageUrl: pageInfo.getFullPageUrl,
                openPDFinViewer: async (originalPageURL) => {
                    await contentScriptsBG.openPdfInViewer({
                        fullPageUrl: originalPageURL,
                    })
                },
            })
            components.ribbon?.resolve()
        },
        async registerHighlightingScript(execute): Promise<void> {
            await execute({
                inPageUI,
                annotationsCache,
                highlightRenderer,
                annotations: annotationsBG,
                annotationsManager,
            })
            components.highlights?.resolve()
        },
        async registerSidebarScript(execute): Promise<void> {
            await execute({
                events: sidebarEvents,
                initialState: inPageUI.componentsShown.sidebar
                    ? 'visible'
                    : 'hidden',
                inPageUI,
                getCurrentUser: () => currentUser,
                annotationsCache,
                highlighter: highlightRenderer,
                analyticsBG,
                authBG,
                annotationsBG,
                bgScriptBG,
                summarizeBG,
                pageIndexingBG,
                syncSettingsBG,
                contentSharingBG,
                contentSharingByTabsBG,
                pageActivityIndicatorBG,
                customListsBG: collectionsBG,
                searchResultLimit: constants.SIDEBAR_SEARCH_RESULT_LIMIT,
                analytics,
                copyToClipboard,
                getFullPageUrl: pageInfo.getFullPageUrl,
                copyPaster,
                subscription,
                contentConversationsBG: runInBackground(),
                contentScriptsBG: runInBackground(),
                imageSupport: runInBackground(),
                pkmSyncBG: runInBackground(),
            })
            components.sidebar?.resolve()
        },
        async registerTooltipScript(execute): Promise<void> {
            await execute({
                inPageUI,
                toolbarNotifications,
                createHighlight: annotationsFunctions.createHighlight({
                    category: 'Highlights',
                    action: 'createFromTooltip',
                }),
                createAnnotation: annotationsFunctions.createAnnotation({
                    category: 'Annotations',
                    action: 'createFromTooltip',
                }),
                askAI: annotationsFunctions.askAI(),
            })
            components.tooltip?.resolve()
        },
        async registerSearchInjectionScript(execute): Promise<void> {
            await execute({
                syncSettingsBG,
                requestSearcher: remoteFunction('search'),
            })
        },
    }

    globalThis['contentScriptRegistry'] = contentScriptRegistry

    // N.B. Building the highlighting script as a seperate content script results in ~6Mb of duplicated code bundle,
    // so it is included in this global content script where it adds less than 500kb.
    await contentScriptRegistry.registerHighlightingScript(highlightMain)

    // 5. Registers remote functions that can be used to interact with components
    // in this tab.
    // TODO:(remote-functions) Move these to the inPageUI class too

    makeRemotelyCallableType<InPageUIContentScriptRemoteInterface>({
        ping: async () => true,
        showSidebar: inPageUI.showSidebar.bind(inPageUI),
        showRibbon: inPageUI.showRibbon.bind(inPageUI),
        testIfSidebarSetup: inPageUI.testIfSidebarSetup.bind(inPageUI),
        reloadRibbon: () => inPageUI.reloadRibbon(),
        insertRibbon: async () => inPageUI.loadComponent('ribbon'),
        removeRibbon: async () => inPageUI.removeRibbon(),
        insertOrRemoveRibbon: async () => inPageUI.toggleRibbon(),
        updateRibbon: async () => inPageUI.updateRibbon(),
        showContentTooltip: async () => inPageUI.showTooltip(),
        insertTooltip: async () => inPageUI.showTooltip(),
        removeTooltip: async () => inPageUI.removeTooltip(),
        insertOrRemoveTooltip: async () => inPageUI.toggleTooltip(),
        goToHighlight: async (annotationCacheId) => {
            const unifiedAnnotation =
                annotationsCache.annotations.byId[annotationCacheId]
            if (!unifiedAnnotation) {
                console.warn(
                    "Tried to go to highlight in new page that doesn't exist in cache",
                )
                return
            }
            await highlightRenderer.highlightAndScroll({
                id: unifiedAnnotation.unifiedId,
                selector: unifiedAnnotation.selector,
            })
        },
        createHighlight: (shouldShare) =>
            annotationsFunctions.createHighlight({
                category: 'Highlights',
                action: 'createFromContextMenu',
            })(window.getSelection(), shouldShare),
        removeHighlights: async () => highlightRenderer.resetHighlightsStyles(),
        teardownContentScripts: async () => {
            await inPageUI.hideHighlights()
            await inPageUI.hideSidebar()
            await inPageUI.removeRibbon()
            await inPageUI.removeTooltip()
            resetKeyboardShortcuts()
        },
        handleHistoryStateUpdate: async (tabId) => {
            await inPageUI.hideRibbon()

            if (window.location.href.includes('web.telegram.org/')) {
                const existingContainer = document.getElementById(
                    `spacesBarContainer`,
                )

                if (existingContainer) {
                    existingContainer.remove()
                }

                await injectTelegramCustomUI(
                    collectionsBG,
                    bgScriptBG,
                    window.location.href,
                )
            }
            if (
                (window.location.href.includes('twitter.com/') ||
                    window.location.href.includes('x.com/')) &&
                !window.location.href.includes('/status/')
            ) {
                await pageInfo.setTwitterFullUrl(null)

                if (window.location.href.includes('/messages')) {
                    const url = await pageInfo.getFullPageUrl()

                    const existingContainer = document.getElementById(
                        `spacesBarContainer_${url}`,
                    )
                    if (!existingContainer) {
                        await trackTwitterMessageList(collectionsBG, bgScriptBG)
                    }
                } else {
                    await injectTwitterProfileUI(
                        collectionsBG,
                        bgScriptBG,
                        await pageInfo.getFullPageUrl(),
                    )
                }
            }
            if (window.location.hostname === 'www.youtube.com') {
                const existingButtons = document.getElementsByClassName(
                    'memex-youtube-buttons',
                )[0]

                if (existingButtons) {
                    existingButtons.remove()
                }
                loadYoutubeButtons(annotationsFunctions)
            }

            const isPageBlacklisted = await checkPageBlacklisted(fullPageUrl)
            if (isPageBlacklisted || !isSidebarEnabled) {
                await inPageUI.removeTooltip()
                await inPageUI.removeRibbon()
            } else {
                await inPageUI.reloadComponent('tooltip')
                await inPageUI.reloadRibbon()
            }

            if (inPageUI.componentsShown.sidebar) {
                await inPageUI.showSidebar()
            }
            highlightRenderer.resetHighlightsStyles()
            await bookmarks.autoSetBookmarkStatusInBrowserIcon(tabId)
            await sleepPromise(500)

            await pageInfo.refreshIfNeeded()
        },
    })

    // 6. Setup other interactions with this page (things that always run)
    // setupScrollReporter()

    initKeyboardShortcuts({
        inPageUI,
        createHighlight: annotationsFunctions.createHighlight({
            category: 'Highlights',
            action: 'createFromShortcut',
        }),
        createAnnotation: annotationsFunctions.createAnnotation({
            category: 'Annotations',
            action: 'createFromShortcut',
        }),
        askAI: annotationsFunctions.askAI(),
    })
    const loadContentScript = createContentScriptLoader({
        contentScriptsBG,
        loadRemotely: params.loadRemotely,
    })
    if (
        shouldIncludeSearchInjection(
            window.location.hostname,
            window.location.href,
        )
    ) {
        await contentScriptRegistry.registerSearchInjectionScript(
            searchInjectionMain,
        )
    }

    const areHighlightsEnabled = await tooltipUtils.getHighlightsState()
    if (areHighlightsEnabled) {
        inPageUI.showHighlights()
        if (!annotationsCache.isEmpty) {
            inPageUI.loadComponent('sidebar')
        }
    }

    const isPageBlacklisted = await checkPageBlacklisted(fullPageUrl)
    const {
        status: pageActivityStatus,
    } = await pageActivityIndicatorBG.getPageActivityStatus(fullPageUrl)

    const hasActivity =
        pageActivityStatus === 'no-annotations' ||
        pageActivityStatus === 'has-annotations'

    if ((isSidebarEnabled && !isPageBlacklisted) || hasActivity) {
        await inPageUI.loadComponent('ribbon', {
            keepRibbonHidden: !isSidebarEnabled,
            showPageActivityIndicator: hasActivity,
        })
        if (await tooltipUtils.getTooltipState()) {
            await inPageUI.setupTooltip()
        }
    }

    setupWebUIActions({ contentScriptsBG, bgScriptBG, pageActivityIndicatorBG })

    if (window.location.hostname === 'www.youtube.com') {
        loadYoutubeButtons(annotationsFunctions)
    }
    if (window.location.href.includes('web.telegram.org/')) {
        await injectTelegramCustomUI(
            collectionsBG,
            bgScriptBG,
            window.location.href,
        )

        annotationsCache.events.on('updatedPageData', (url, pageListIds) => {
            let spacesBar: HTMLElement
            let existingContainer: HTMLElement
            const pageListIdURL = 'https://' + url

            existingContainer = document.getElementById('spacesBarContainer')
            spacesBar = document.getElementById('spacesBar')

            if (spacesBar) {
                spacesBar.remove()
            }

            const lists = Array.from(pageListIds).map((listId) => {
                return annotationsCache.lists.byId[listId]
            })

            spacesBar = renderSpacesBar(lists, bgScriptBG, pageListIdURL)

            if (existingContainer) {
                existingContainer.appendChild(spacesBar)
            }
        })
    }
    if (
        window.location.href.includes('twitter.com/') ||
        (window.location.href.includes('x.com/') &&
            !window.location.href.includes('/status/'))
    ) {
        if (window.location.href.includes('/messages')) {
            await trackTwitterMessageList(collectionsBG, bgScriptBG)
        } else {
            await injectTwitterProfileUI(
                collectionsBG,
                bgScriptBG,
                await pageInfo.getFullPageUrl(),
            )
        }

        annotationsCache.events.on('updatedPageData', (url, pageListIds) => {
            const pageListIdURL = 'https://' + url

            const lists = Array.from(pageListIds).map((listId) => {
                return annotationsCache.lists.byId[listId]
            })

            let spacesBar: HTMLElement

            if (window.location.href.includes('/messages')) {
                spacesBar = renderSpacesBar(lists, bgScriptBG, pageListIdURL)
            } else {
                spacesBar = renderSpacesBar(lists, bgScriptBG, pageListIdURL)
            }

            let existingContainer: HTMLElement

            if (window.location.href.includes('/messages')) {
                existingContainer = document.getElementById(
                    `spacesBarContainer_${pageListIdURL}`,
                )
            } else {
                existingContainer = document.getElementById(
                    `spacesBarContainer_${pageListIdURL}`,
                )
            }
            if (existingContainer) {
                existingContainer.appendChild(spacesBar)
            }
        })
    }

    if (analyticsBG && hasActivity) {
        try {
            trackPageActivityIndicatorHit(analyticsBG)
        } catch (error) {
            console.error(`Error tracking space create event', ${error}`)
        }
    }

    return inPageUI
}

type ContentScriptLoader = (component: ContentScriptComponent) => Promise<void>
export function createContentScriptLoader(args: {
    contentScriptsBG: ContentScriptsInterface<'caller'>
    loadRemotely: boolean
}) {
    const remoteLoader: ContentScriptLoader = async (component) => {
        await args.contentScriptsBG.injectContentScriptComponent({
            component,
        })
    }

    const localLoader: ContentScriptLoader = async (component) => {
        const script = document.createElement('script')
        script.src = `../content_script_${component}.js`
        document.body.appendChild(script)
    }

    return args?.loadRemotely ? remoteLoader : localLoader
}

export function loadRibbonOnMouseOver(loadRibbon: () => void) {
    const listener = (event: MouseEvent) => {
        if (event.clientX > window.innerWidth - 200) {
            loadRibbon()
            document.removeEventListener('mousemove', listener)
        }
    }
    document.addEventListener('mousemove', listener)
}

class PageInfo {
    isPdf: boolean
    _href?: string
    _identifier?: ContentIdentifier
    private normalizedTwitterFullUrl?: string

    constructor(
        public options?: { getContentFingerprints?: GetContentFingerprints },
    ) {
        this.isPdf = isUrlPDFViewerUrl(window.location.href, {
            runtimeAPI: runtime,
        })
    }

    async refreshIfNeeded() {
        let fullUrl = null

        if (window.location.href === this._href) {
            return
        }

        if (window.location.href.includes('youtube.com/')) {
            await sleepPromise(500)
            fullUrl = getUnderlyingResourceUrl(window.location.href)
        } else if (
            window.location.href.includes('twitter.com/messages') ||
            window.location.href.includes('x.com/messages')
        ) {
            if (!this.normalizedTwitterFullUrl) {
                fullUrl = await this.normalizeTwitterCurrentFullURL()
            }
            await sleepPromise(0)
        } else {
            fullUrl = getUnderlyingResourceUrl(window.location.href)
            await sleepPromise(50)
        }

        this.isPdf = isUrlPDFViewerUrl(window.location.href, {
            runtimeAPI: runtime,
        })

        this._identifier = await runInBackground<
            PageIndexingInterface<'caller'>
        >().initContentIdentifier({
            locator: {
                format: this.isPdf
                    ? ContentLocatorFormat.PDF
                    : ContentLocatorFormat.HTML,
                originalLocation: fullUrl,
            },
            fingerprints:
                (await this.options?.getContentFingerprints?.()) ?? [],
        })
        if (!this._identifier?.normalizedUrl || !this._identifier?.fullUrl) {
            console.error(`Invalid content identifier`, this._identifier)
            throw new Error(`Got invalid content identifier`)
        }

        this._href = window.location.href
    }

    normalizeTwitterCurrentFullURL = async () => {
        let fullUrl
        let retryCount = 0
        const MAX_RETRIES = 60
        if (this.normalizedTwitterFullUrl != null) {
            return this.normalizedTwitterFullUrl
        }
        if (window.location.href === 'https://twitter.com/messages') {
            return 'https://twitter.com/messages'
        }
        while (retryCount < MAX_RETRIES) {
            const activeChatItem = document.querySelector(
                '[aria-selected="true"]',
            )
            if (activeChatItem) {
                const userName = activeChatItem.textContent
                    .split('@')[1]
                    .split('·')[0]

                if (userName) {
                    fullUrl = `https://twitter.com/${userName}`
                    this.normalizedTwitterFullUrl = fullUrl
                    return fullUrl
                }
            } else {
                retryCount++ // Increment retry count if no valid item found
                await sleepPromise(50) // Wait for 1 second before next try
            }
        }
    }

    setTwitterFullUrl = async (url) => {
        this.normalizedTwitterFullUrl = url

        return
    }
    getTwitterFullUrl = () => {
        return this.normalizedTwitterFullUrl
    }

    getFullPageUrl = async () => {
        await this.refreshIfNeeded()
        let fullUrl = this._identifier.fullUrl

        if (window.location.href.includes('twitter.com/messages')) {
            fullUrl = await this.normalizeTwitterCurrentFullURL()
            return fullUrl
        } else {
            return fullUrl
        }
    }

    getPageTitle = () => {
        let title = document.title

        if (window.location.href.includes('web.telegram.org/')) {
            const url = window.location.href
            title = getTelegramUserDisplayName(document, url)
        }

        return title
    }

    getNormalizedPageUrl = async () => {
        await this.refreshIfNeeded()
        return this._identifier.normalizedUrl
    }
}

export async function injectTelegramCustomUI(
    collectionsBG,
    bgScriptBG: RemoteBGScriptInterface,
    url: string,
) {
    try {
        const textField = document.getElementsByClassName(
            'input-message-input',
        )[0]
        if (textField) {
            textField.classList.add('mousetrap')
        }

        let selector

        selector = '[class="topbar"]'

        const maxRetries = 10
        const delayInMilliseconds = 500 // adjust this based on your needs

        const userNameBox = (
            await findClassElementSWithRetries(
                'topbar',
                maxRetries,
                delayInMilliseconds,
            )
        )[0] as HTMLElement

        if (userNameBox != null) {
            let spacesBar: HTMLElement
            let spacesBarContainer = document.createElement('div')
            spacesBarContainer.id = 'spacesBarContainer'
            spacesBarContainer.style.width = '100%'
            spacesBarContainer.style.zIndex = '3'
            spacesBarContainer.style.height = 'fit-content'
            spacesBarContainer.style.overflow = 'scroll'
            spacesBarContainer.style.padding = '10px 15px 15px 15px'
            spacesBarContainer.style.width = '100%'

            userNameBox.insertAdjacentElement('afterend', spacesBarContainer)

            const pageLists = await fetchListDataForSocialProfiles(
                collectionsBG,
                url,
            )

            if (pageLists != null && pageLists.length > 0) {
                spacesBar = renderSpacesBar(pageLists, bgScriptBG)

                spacesBarContainer.appendChild(spacesBar)
            } else {
                return
            }
        }
    } catch (error) {
        console.error(error.message)
    }
}

export async function getActiveTwitterUserName(
    maxRetries,
    delayInMilliseconds,
) {
    const filteredElements = await findElementWithRetries(
        '[aria-selected="true"]',
        maxRetries,
        delayInMilliseconds,
    )

    return filteredElements
}

export async function trackTwitterMessageList(
    collectionsBG,
    bgScriptBG: RemoteBGScriptInterface,
) {
    const maxRetries = 40
    const delayInMilliseconds = 500

    const tabListDiv = (await findElementWithRetries(
        '[role="tablist"]',
        maxRetries,
        delayInMilliseconds,
    )) as HTMLElement

    if (tabListDiv) {
        // Your main logic encapsulated in a function
        const processNode = async (node) => {
            if (!node?.textContent.includes(`’s message with`)) {
                const userName =
                    node?.textContent.split('@')[1]?.split('·')[0] ?? ''

                if (userName) {
                    let fullUrl = `https://twitter.com/${userName}`

                    let spacesBarContainer = document.createElement('div')
                    spacesBarContainer.id = `spacesBarContainer_${fullUrl}`
                    spacesBarContainer.style.display = 'flex'

                    const pageLists = await fetchListDataForSocialProfiles(
                        collectionsBG,
                        fullUrl,
                    )

                    if (pageLists != null && pageLists.length > 0) {
                        const spacesBar = renderSpacesBar(
                            pageLists,
                            bgScriptBG,
                            fullUrl,
                        ) as HTMLElement
                        spacesBar.style.flexWrap = 'wrap'
                        spacesBarContainer.style.marginTop = '5px'
                        spacesBarContainer.appendChild(spacesBar)
                    }
                    let element = node as HTMLElement
                    let conversationElement = element.querySelector(
                        '[data-testid="conversation"]',
                    ) as HTMLElement

                    if (conversationElement) {
                        conversationElement.insertAdjacentElement(
                            'beforeend',
                            spacesBarContainer,
                        )
                    }
                }
            }
        }

        // Initial processing
        tabListDiv.childNodes.forEach((node) => processNode(node))

        // Mutation Observer
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            processNode(node)
                        }
                    })
                }
            }
        })

        observer.observe(tabListDiv, { childList: true })
    }
}

export async function injectTwitterProfileUI(
    collectionsBG,
    bgScriptBG: RemoteBGScriptInterface,
    url: string,
) {
    const maxRetries = 40
    const delayInMilliseconds = 500 // adjust this based on your needs
    let pageType: string

    try {
        let userNameBox: HTMLElement
        const selector = '[data-testid="UserDescription"]'
        userNameBox = (await findElementWithRetries(
            selector,
            maxRetries,
            delayInMilliseconds,
        )) as HTMLElement

        if (userNameBox != null) {
            let spacesBar: HTMLElement
            let spacesBarContainer = document.createElement('div')
            spacesBarContainer.id = `spacesBarContainer_${url}`
            spacesBarContainer.style.marginTop = '5px'

            userNameBox.insertAdjacentElement('beforeend', spacesBarContainer)

            const pageLists = await fetchListDataForSocialProfiles(
                collectionsBG,
                url,
            )

            if (pageLists != null && pageLists.length > 0) {
                spacesBar = renderSpacesBar(pageLists, bgScriptBG, url)
                spacesBarContainer.appendChild(spacesBar)
                userNameBox.style.marginBottom = '10px'
            } else {
                return
            }
        }
    } catch (error) {
        console.error(error.message)
    }
    return
}

async function fetchListDataForSocialProfiles(collectionsBG, fullUrl: string) {
    const lists = await collectionsBG.fetchPageListEntriesByUrl({
        url: fullUrl,
    })
    if (lists.length > 0) {
        const updatedLists = await Promise.all(
            lists
                .filter((list) => list.listId !== 20201014)
                .map(async (list) => {
                    const listData = await collectionsBG.fetchListById({
                        id: list.listId,
                    })
                    ;(list as any).name = listData.name // Add the list name to the original list object.
                    return list
                }),
        )
        return updatedLists
    }
}

async function findElementWithRetries(selector, retries, delay) {
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const element = document.querySelector(selector)

            if (element) {
                resolve(element)
            } else if (retries > 0) {
                setTimeout(() => {
                    retries--
                    attempt()
                }, delay)
            } else {
                reject(new Error('Element not found after maximum retries.'))
            }
        }

        attempt()
    })
}

async function findElementSWithRetries(selector, retries, delay) {
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const element = document.querySelectorAll(selector)

            if (element) {
                resolve(element)
            } else if (retries > 0) {
                setTimeout(() => {
                    retries--
                    attempt()
                }, delay)
            } else {
                reject(new Error('Element not found after maximum retries.'))
            }
        }

        attempt()
    })
}
async function findClassElementSWithRetries(className, retries, delay) {
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const element = document.getElementsByClassName(className)
            if (element) {
                resolve(element)
            } else if (retries > 0) {
                setTimeout(() => {
                    retries--
                    attempt()
                }, delay)
            } else {
                reject(new Error('Element not found after maximum retries.'))
            }
        }

        attempt()
    })
}

function renderSpacesBar(
    lists: UnifiedList[],
    bgScriptBG: RemoteBGScriptInterface,
    url?: string,
) {
    let spacesBar: HTMLElement

    if (url) {
        spacesBar = document.getElementById(`spacesBar_${url}`)
    } else {
        spacesBar = document.getElementById(`spacesBar`)
    }

    if (!spacesBar) {
        spacesBar = document.createElement('div')
    } else {
        spacesBar.innerHTML = ''
    }

    if (lists.length > 0) {
        spacesBar.id = url ? `spacesBar_${url}` : `spacesBar`
        spacesBar.style.display = 'flex'
        spacesBar.style.alignItems = 'center'
        spacesBar.style.gap = '5px'
        spacesBar.style.flexWrap = 'wrap'
    } else {
        spacesBar.id = url ? `spacesBar_${url}` : `spacesBar`
        spacesBar.style.display = 'flex'
        spacesBar.style.alignItems = 'center'
        spacesBar.style.gap = '0px'
        spacesBar.style.marginTop = '0px'
    }

    lists.forEach((list) => {
        const listDiv = document.createElement('div')
        listDiv.style.background = '#C6F0D4'
        listDiv.style.padding = '3px 10px'
        listDiv.style.marginTop = '5px'
        listDiv.style.borderRadius = '5px'
        listDiv.style.cursor = 'pointer'
        listDiv.style.color = '#12131B'
        listDiv.style.fontSize = '14px'
        listDiv.style.display = 'flex'
        listDiv.style.alignItems = 'center'
        listDiv.style.fontFamily = 'Arial'
        listDiv.innerText = list.name // assuming 'name' is a property of the list items
        listDiv.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            bgScriptBG.openOverviewTab({
                // TODO: fix type but list.localId is not working. Tetst by clicking on the pills in telegram/twitter. They should jump to the right space in the dashboard
                /** @ts-ignore */
                selectedSpace: list.listId || list.localId,
            })
        })
        spacesBar.appendChild(listDiv)
    })

    return spacesBar
}

export function loadYoutubeButtons(annotationsFunctions) {
    const below = document.querySelector('#below')
    const player = document.querySelector('#player')

    if (below) {
        injectYoutubeButtonMenu(annotationsFunctions)
    }
    if (player) {
        injectYoutubeContextMenu(annotationsFunctions)
    }

    if (!below || !player) {
        // Create a new MutationObserver instance
        const observer = new MutationObserver(function (
            mutationsList,
            observer,
        ) {
            mutationsList.forEach(function (mutation) {
                mutation.addedNodes.forEach((node) => {
                    // Check if the added node is an HTMLElement
                    if (!player) {
                        if (node instanceof HTMLElement) {
                            // Check if the "player" element is in the added node or its descendants
                            if (node.querySelector('#player')) {
                                injectYoutubeContextMenu(annotationsFunctions)

                                if (below && player) {
                                    observer.disconnect()
                                }
                            }
                        }
                    }
                    if (!below) {
                        if (node instanceof HTMLElement) {
                            // Check if the "below" element is in the added node or its descendants
                            if (node.querySelector('#below')) {
                                injectYoutubeButtonMenu(annotationsFunctions)

                                if (below && player) {
                                    observer.disconnect()
                                }
                            }
                        }
                    }
                })
            })
        })

        // Start observing mutations to the document body
        observer.observe(document.body, { childList: true, subtree: true })
    }
}

export function injectYoutubeContextMenu(annotationsFunctions: any) {
    const config = { attributes: true, childList: true, subtree: true }
    const icon = runtime.getURL('/img/memex-icon.svg')

    const observer = new MutationObserver((mutation) => {
        const targetObject = mutation[0]
        if (
            (targetObject.target as HTMLElement).className ===
            'ytp-popup ytp-contextmenu'
        ) {
            const panel = document.getElementsByClassName('ytp-panel-menu')[1]
            const newEntry = document.createElement('div')
            newEntry.setAttribute('class', 'ytp-menuitem')
            newEntry.onclick = () =>
                annotationsFunctions.createAnnotation()(
                    false,
                    false,
                    false,
                    getTimestampNoteContentForYoutubeNotes(),
                )
            newEntry.innerHTML = `<div class="ytp-menuitem-icon"><img src=${icon} style="height: 23px; padding-left: 2px; display: flex; width: auto"/></div><div class="ytp-menuitem-label" style="white-space: nowrap">Add Note to current time</div>`
            panel.prepend(newEntry)
            // panel.style.height = "320px"
            observer.disconnect()
        }
    })

    observer.observe(document, config)
}

export async function getTimestampedNoteWithAIsummaryForYoutubeNotes(
    includeLastFewSecs,
) {
    const videoId = new URL(window.location.href).searchParams.get('v')
    const isStaging =
        process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
        process.env.NODE_ENV === 'development'

    const baseUrl = isStaging
        ? 'https://cloudflare-memex-staging.memex.workers.dev'
        : 'https://cloudfare-memex.memex.workers.dev'

    const normalisedYoutubeURL = 'https://www.youtube.com/watch?v=' + videoId

    const response = await fetch(baseUrl + '/youtube-transcripts', {
        method: 'POST',
        body: JSON.stringify({
            originalUrl: normalisedYoutubeURL,
            getRawTranscript: true,
        }),
        headers: { 'Content-Type': 'application/json' },
    })

    let responseContent = await response.text()

    const transcriptJSON = JSON.parse(responseContent).transcriptText

    if (transcriptJSON === null) {
        return null
    }

    const [startTimeURL, humanTimestamp] = getHTML5VideoTimestamp(
        includeLastFewSecs,
    )
    const [endTimeURL] = getHTML5VideoTimestamp(0)

    const startTimeSecs = parseFloat(
        new URL(startTimeURL).searchParams.get('t'),
    )
    const endTimeSecs = parseFloat(new URL(endTimeURL).searchParams.get('t'))
    const videoTimeStampForComment = `[${humanTimestamp}](${startTimeURL})`

    const relevantTranscriptItems = transcriptJSON.filter((item) => {
        const flooredStart = Math.floor(item.start)
        const flooredEnd = Math.floor(item.end)

        return (
            (flooredStart >= startTimeSecs && flooredStart <= endTimeSecs) ||
            (flooredEnd >= startTimeSecs && flooredEnd <= endTimeSecs)
        )
    })

    return [videoTimeStampForComment, JSON.stringify(relevantTranscriptItems)]
}

export function getTimestampNoteContentForYoutubeNotes(
    includeLastFewSecs?: number,
) {
    let videoTimeStampForComment: string | null

    const [videoURLWithTime, humanTimestamp] = getHTML5VideoTimestamp(
        includeLastFewSecs ?? 0,
    )

    if (videoURLWithTime != null) {
        videoTimeStampForComment = `[${humanTimestamp}](${videoURLWithTime})`

        return videoTimeStampForComment
    } else {
        return null
    }
}

export async function injectYoutubeButtonMenu(annotationsFunctions: any) {
    const YTchapterContainer = document.getElementsByClassName(
        'ytp-chapter-container',
    )

    if (YTchapterContainer.length > 0) {
        let container = YTchapterContainer[0] as HTMLElement
        container.style.display = 'flex'
        container.style.flex = '1'
        container.style.width = '250px'
    }

    const existingMemexButtons = document.getElementsByClassName(
        'memex-youtube-buttons',
    )
    if (existingMemexButtons.length > 0) {
        existingMemexButtons[0].remove()
    }

    const panel = document.getElementsByClassName('ytp-time-display')[0]
    // Memex Button Container
    const memexButtons = document.createElement('div')
    memexButtons.style.display = 'flex'
    memexButtons.style.alignItems = 'center'
    memexButtons.style.margin = '10px 0px'
    memexButtons.style.borderRadius = '6px'
    memexButtons.style.border = '1px solid #3E3F47'
    memexButtons.style.overflow = 'hidden'
    memexButtons.style.overflowX = 'scroll'
    memexButtons.style.backgroundColor = '#12131B'
    memexButtons.setAttribute('class', 'memex-youtube-buttons no-scrollbar')
    // Create a <style> element
    const style = document.createElement('style')

    // Add your CSS as a string
    style.textContent = `
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            scrollbar-width: none;
        }
        `

    // Assuming `memexButtons` is your DOM element

    document.head.appendChild(style)

    // Add screenshot Button
    const screenshotButton = document.createElement('div')
    screenshotButton.setAttribute('class', 'ytp-menuitem')
    screenshotButton.onclick = async () => {
        await annotationsFunctions.createTimestampWithScreenshot()
    }
    screenshotButton.style.display = 'flex'
    screenshotButton.style.alignItems = 'center'
    screenshotButton.style.cursor = 'pointer'
    screenshotButton.style.borderLeft = '1px solid #24252C'

    screenshotButton.innerHTML = `<div class="ytp-menuitem-label" id="screenshotButtonInner"  style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Screenshot</div>`

    // Add Note Button
    const annotateButton = document.createElement('div')
    annotateButton.setAttribute('class', 'ytp-menuitem')
    annotateButton.onclick = async () => {
        const secondsInPastFieldNote = document.getElementById(
            'secondsInPastFieldNote',
        ) as HTMLInputElement
        const secondsInPastContainerNote = document.getElementById(
            'secondsInPastContainerNote',
        ) as HTMLInputElement

        const includeLastFewSecs = secondsInPastFieldNote.value
            ? parseInt(secondsInPastFieldNote.value)
            : 0

        await globalThis['browser'].storage.local.set({
            ['noteSecondsStorage']: includeLastFewSecs,
        })

        annotationsFunctions.createAnnotation()(
            false,
            false,
            false,
            getTimestampNoteContentForYoutubeNotes(includeLastFewSecs),
            includeLastFewSecs,
        )
    }
    annotateButton.style.display = 'flex'
    annotateButton.style.alignItems = 'center'
    annotateButton.style.cursor = 'pointer'
    annotateButton.style.borderLeft = '1px solid #24252C'

    annotateButton.innerHTML = `<div class="ytp-menuitem-label" style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Timestamped Note</div>`

    // Summarize Button
    const summarizeButton = document.createElement('div')
    summarizeButton.setAttribute('class', 'ytp-menuitem')
    summarizeButton.onclick = () => annotationsFunctions.askAI()(false, false)
    summarizeButton.style.display = 'flex'
    summarizeButton.style.alignItems = 'center'
    summarizeButton.style.cursor = 'pointer'
    summarizeButton.style.borderLeft = '1px solid #24252C'
    summarizeButton.innerHTML = `<div class="ytp-menuitem-label" style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Summarize Video</div>`

    // Textfield for Smart Note
    const textField = document.createElement('input')
    textField.id = 'secondsInPastSetting'
    const smartNoteSecondsStorage = await globalThis[
        'browser'
    ].storage.local.get('smartNoteSecondsStorage')

    const smartNoteSeconds = smartNoteSecondsStorage.smartNoteSecondsStorage

    if (smartNoteSeconds) {
        textField.value = smartNoteSeconds
    }
    textField.setAttribute('type', 'text')
    textField.setAttribute('placeholder', '60s')
    textField.style.height = '100%'
    textField.style.width = '84px'
    textField.style.borderRadius = '6px'
    textField.style.padding = '5px 10px'
    textField.style.overflow = 'hidden'
    textField.style.background = 'transparent'
    textField.style.outline = 'none'
    textField.style.color = '#f4f4f4'
    textField.style.textAlign = 'center'
    textField.style.position = 'absolute'

    // Textfield for Regular Note
    const textFieldNote = document.createElement('input')
    textFieldNote.id = 'secondsInPastFieldNote'

    const noteSecondsStorage = await globalThis['browser'].storage.local.get(
        'noteSecondsStorage',
    )

    const noteSeconds = noteSecondsStorage.noteSecondsStorage

    if (noteSeconds) {
        textFieldNote.value = noteSeconds
    }

    textFieldNote.setAttribute('type', 'text')
    textFieldNote.setAttribute('placeholder', '0s')
    textFieldNote.style.height = '100%'
    textFieldNote.style.width = '84px'
    textFieldNote.style.borderRadius = '6px'
    textFieldNote.style.padding = '5px 10px'
    textFieldNote.style.overflow = 'hidden'
    textFieldNote.style.background = 'transparent'
    textFieldNote.style.outline = 'none'
    textFieldNote.style.color = '#f4f4f4'
    textFieldNote.style.textAlign = 'center'
    textFieldNote.style.position = 'absolute'

    // Stop click event propagation on the textfield to its parent
    textFieldNote.addEventListener('click', (event) => {
        event.stopPropagation()
    })

    // Add keyup event to the textfield for the "Enter" key
    textFieldNote.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
            annotateButton.click()
        }
    })

    textField.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
            AItimeStampButton.click()
        }
    })

    // Set maxLength to 3 to limit input to 999
    textField.setAttribute('maxlength', '3')
    textFieldNote.setAttribute('maxlength', '3')

    // Optional: use pattern attribute for native validation
    textField.setAttribute('pattern', '\\d{1,3}') // 1 to 3 digit numbers
    textFieldNote.setAttribute('pattern', '\\d{1,3}') // 1 to 3 digit numbers

    textField.addEventListener('input', (event) => {
        let value = (event.target as HTMLInputElement).value

        // Replace non-digit characters
        value = value.replace(/[^0-9]/g, '')

        // If number is greater than 999, set it to 999
        if (parseInt(value) > 999) {
            value = '999'
        }

        ;(event.target as HTMLInputElement).value = value
    })

    textFieldNote.addEventListener('input', (event) => {
        let value = (event.target as HTMLInputElement).value

        // Replace non-digit characters
        value = value.replace(/[^0-9]/g, '')

        // If number is greater than 999, set it to 999
        if (parseInt(value) > 999) {
            value = '999'
        }

        ;(event.target as HTMLInputElement).value = value
    })

    // Rewind Icon
    const rewindIcon = runtime.getURL('/img/historyYoutubeInjection.svg')
    const rewindIconEl = document.createElement('img')
    rewindIconEl.src = rewindIcon
    rewindIconEl.style.height = '18px'
    rewindIconEl.style.margin = '0 10px 0 10px'
    // Rewind Icon
    const rewindIcon2 = runtime.getURL('/img/historyYoutubeInjection.svg')
    const rewindIconEl2 = document.createElement('img')
    rewindIconEl2.src = rewindIcon2
    rewindIconEl2.style.height = '18px'
    rewindIconEl2.style.margin = '0 10px 0 10px'

    // TextField ADd NOTE Container
    const textFieldContainerNote = document.createElement('div')
    textFieldContainerNote.id = 'secondsInPastContainerNote'
    textFieldContainerNote.appendChild(rewindIconEl2)
    textFieldContainerNote.appendChild(textFieldNote)
    textFieldContainerNote.style.display = 'flex'
    textFieldContainerNote.style.alignItems = 'center'
    textFieldContainerNote.style.margin = '0 10px'
    textFieldContainerNote.style.borderRadius = '6px'
    textFieldContainerNote.style.outline = '1px solid #3E3F47'
    textFieldContainerNote.style.overflow = 'hidden'
    textFieldContainerNote.style.background = '#1E1F26'
    textFieldContainerNote.style.width = '84px'
    textFieldContainerNote.style.height = '26px'
    textFieldContainerNote.style.position = 'relative'

    textFieldContainerNote.addEventListener('click', (event) => {
        event.stopPropagation()
    })

    // TextField Smart Note Container
    const textFieldContainer = document.createElement('div')
    textFieldContainer.id = 'secondsInPastSettingContainer'
    textFieldContainer.appendChild(rewindIconEl)
    textFieldContainer.appendChild(textField)
    textFieldContainer.style.display = 'flex'
    textFieldContainer.style.alignItems = 'center'
    textFieldContainer.style.margin = '0 10px'
    textFieldContainer.style.borderRadius = '6px'
    textFieldContainer.style.outline = '1px solid #3E3F47'
    textFieldContainer.style.overflow = 'hidden'
    textFieldContainer.style.background = '#1E1F26'
    textFieldContainer.style.width = '84px'
    textFieldContainer.style.height = '26px'
    textFieldContainer.style.position = 'relative'

    textFieldContainer.addEventListener('click', (event) => {
        event.stopPropagation()
    })

    // AI timestamp Button
    const AItimeStampButton = document.createElement('div')
    AItimeStampButton.id = 'AItimeStampButton'
    AItimeStampButton.setAttribute('class', 'ytp-menuitem')

    AItimeStampButton.onclick = async () => {
        const secondsInPastField = document.getElementById(
            'secondsInPastSetting',
        ) as HTMLInputElement
        const secondsInPastSettingContainer = document.getElementById(
            'secondsInPastSettingContainer',
        ) as HTMLInputElement

        const includeLastFewSecs = secondsInPastField.value
            ? parseInt(secondsInPastField.value)
            : 60
        await globalThis['browser'].storage.local.set({
            ['smartNoteSecondsStorage']: includeLastFewSecs,
        })

        annotationsFunctions.createTimestampWithAISummary(includeLastFewSecs)(
            false,
            false,
            false,
            getTimestampNoteContentForYoutubeNotes(includeLastFewSecs),
        )
    }
    AItimeStampButton.style.borderLeft = '1px solid #24252C'

    AItimeStampButton.style.display = 'flex'
    AItimeStampButton.style.alignItems = 'center'
    AItimeStampButton.style.cursor = 'pointer'

    AItimeStampButton.innerHTML = `<div class="ytp-menuitem-label"  id="AItimeStampButtonInner" style="font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on; font-family: Satoshi, sans-serif; font-size: 14px;padding: 0px 12 0 6px; align-items: center; justify-content: center; white-space: nowrap; display: flex; align-items: center">Smart Note</div>`
    AItimeStampButton.appendChild(textFieldContainer)
    annotateButton.appendChild(textFieldContainerNote)

    // MemexIconDisplay
    const memexIcon = runtime.getURL('/img/memex-icon.svg')
    const memexIconEl = document.createElement('img')
    memexIconEl.src = memexIcon
    memexButtons.appendChild(memexIconEl)
    memexIconEl.style.margin = '0 10px 0 15px'
    memexIconEl.style.height = '20px'

    // TimestampIcon
    const timestampIcon = runtime.getURL('/img/clockForYoutubeInjection.svg')
    const timeStampEl = document.createElement('img')
    timeStampEl.src = timestampIcon
    timeStampEl.style.height = '20px'
    timeStampEl.style.margin = '0 10px 0 10px'
    annotateButton.insertBefore(timeStampEl, annotateButton.firstChild)
    // TimestampIcon
    const cameraIcon = runtime.getURL('/img/cameraIcon.svg')
    const cameraIconEl = document.createElement('img')
    cameraIconEl.src = cameraIcon
    cameraIconEl.style.height = '20px'
    cameraIconEl.style.margin = '0 10px 0 10px'
    screenshotButton.insertBefore(cameraIconEl, screenshotButton.firstChild)

    // AI timestamp icon
    const AItimestampIcon = runtime.getURL('/img/starsYoutube.svg')
    const AItimestampIconEl = document.createElement('img')
    AItimestampIconEl.src = AItimestampIcon
    AItimestampIconEl.style.height = '20px'
    AItimestampIconEl.style.margin = '0 10px 0 10px'
    AItimeStampButton.insertBefore(
        AItimestampIconEl,
        AItimeStampButton.firstChild,
    )

    // SummarizeIcon
    const summarizeIcon = runtime.getURL(
        '/img/summarizeIconForYoutubeInjection.svg',
    )
    const summarizeIconEl = document.createElement('img')
    summarizeIconEl.src = summarizeIcon
    summarizeIconEl.style.height = '20px'
    summarizeIconEl.style.margin = '0 5px 0 10px'
    summarizeButton.insertBefore(summarizeIconEl, summarizeButton.firstChild)

    // Appending the right buttons
    memexButtons.appendChild(annotateButton)
    memexButtons.appendChild(AItimeStampButton)
    memexButtons.appendChild(summarizeButton)
    memexButtons.appendChild(screenshotButton)
    memexButtons.style.color = '#f4f4f4'
    memexButtons.style.width = 'fit-content'
    const aboveFold = document.getElementById('below')
    const existingButtons = document.getElementsByClassName(
        'memex-youtube-buttons',
    )[0]

    if (existingButtons) {
        existingButtons.remove()
    }

    aboveFold.insertAdjacentElement('afterbegin', memexButtons)
}

export function setupWebUIActions(args: {
    contentScriptsBG: ContentScriptsInterface<'caller'>
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    bgScriptBG: RemoteBGScriptInterface
}) {
    const confirmRequest = (requestId: number) => {
        const detail: MemexRequestHandledDetail = { requestId }
        const event = new CustomEvent(MEMEX_REQUEST_HANDLED_EVENT_NAME, {
            detail,
        })
        document.dispatchEvent(event)
    }

    if (checkBrowser() === 'firefox') {
        const observer = new MutationObserver(async (mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const addedElement = document.getElementById(
                        'openPageInSelectedListModeTriggerElement',
                    ) // replace "specificID" with your actual ID
                    if (addedElement) {
                        const fullPageUrl = addedElement.getAttribute(
                            'sourceurl',
                        )
                        const sharedListId = addedElement.getAttribute(
                            'sharedlistid',
                        )
                        const manuallyPullLocalListData =
                            addedElement.getAttribute('iscollaboratorlink') ===
                                'true' ||
                            addedElement.getAttribute('isownlink') === 'true' // because this will be a string

                        // todo maybe add timeout

                        await sleepPromise(2000)

                        await args.contentScriptsBG.openPageWithSidebarInSelectedListMode(
                            {
                                fullPageUrl,
                                sharedListId,
                                manuallyPullLocalListData,
                            },
                        ) // call your function here

                        addedElement.remove()

                        observer.disconnect() // Optionally disconnect the observer if you only want to detect the element once
                    }
                }
            }
        })

        // Start observing the whole document
        observer.observe(document.body, { childList: true, subtree: true })
    } else {
        document.addEventListener(MEMEX_OPEN_LINK_EVENT_NAME, async (event) => {
            const detail = event.detail as MemexOpenLinkDetail
            confirmRequest(detail.requestId)

            // Handle local PDFs first (memex.cloud URLs)
            if (isMemexPageAPdf({ url: detail.originalPageUrl })) {
                await args.bgScriptBG.openOverviewTab({ missingPdf: true })
                return
            }

            await args.contentScriptsBG.openPageWithSidebarInSelectedListMode({
                fullPageUrl: detail.originalPageUrl,
                sharedListId: detail.sharedListId,
                manuallyPullLocalListData:
                    detail.isCollaboratorLink || detail.isOwnLink,
            })
        })
    }
}
