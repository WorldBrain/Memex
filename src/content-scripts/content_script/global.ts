import 'core-js'
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
import { HighlightRenderer } from 'src/highlighting/ui/highlight-interactions'
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
import { hydrateCache } from 'src/annotations/cache/utils'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import { UNDO_HISTORY } from 'src/constants'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { isUrlPDFViewerUrl } from 'src/pdf/util'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import type { SummarizationInterface } from 'src/summarization-llm/background'
import { upgradePlan } from 'src/util/subscriptions/storage'
import { sleepPromise } from 'src/util/promises'
import { browser } from 'webextension-polyfill-ts'

// Content Scripts are separate bundles of javascript code that can be loaded
// on demand by the browser, as needed. This main function manages the initialisation
// and dependencies of content scripts.

export async function main(
    params: {
        loadRemotely?: boolean
        getContentFingerprints?: GetContentFingerprints
    } = {},
): Promise<SharedInPageUIState> {
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
                    highlightRenderer.undoHighlight(lastAction.id)
                    lastActions.shift()
                    await globalThis['browser'].storage.local.set({
                        [`${UNDO_HISTORY}`]: lastActions,
                    })
                }

                const existing =
                    annotationsCache.annotations.byId[lastAction.id]
                annotationsCache.removeAnnotation({ unifiedId: lastAction.id })

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
    const authBG = runInBackground<AuthRemoteFunctionsInterface>()
    const bgScriptBG = runInBackground<RemoteBGScriptInterface>()
    const summarizeBG = runInBackground<SummarizationInterface<'caller'>>()
    const annotationsBG = runInBackground<AnnotationInterface<'caller'>>()
    const contentSharingBG = runInBackground<ContentSharingInterface>()
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
    const highlightRenderer = new HighlightRenderer({
        annotationsBG,
        contentSharingBG,
    })
    const sidebarEvents = new EventEmitter() as AnnotationsSidebarInPageEventEmitter

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
    const _currentUser = await authBG.getCurrentUser()
    const currentUser: UserReference = _currentUser
        ? { type: 'user-reference', id: _currentUser.id }
        : undefined
    const fullPageUrl = await pageInfo.getFullPageUrl()
    const normalizedPageUrl = await pageInfo.getNormalizedPageUrl()
    const annotationsCache = new PageAnnotationsCache({ normalizedPageUrl })
    window['__annotationsCache'] = annotationsCache

    const pageHasBookark = await bookmarks.pageHasBookmark(fullPageUrl)
    await bookmarks.setBookmarkStatusInBrowserIcon(pageHasBookark, fullPageUrl)

    const loadCacheDataPromise = hydrateCache({
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

    const annotationFunctionsParams = {
        inPageUI,
        annotationsCache,
        getSelection: () => document.getSelection(),
        getFullPageUrlAndTitle: async () => ({
            title: pageInfo.getPageTitle(),
            fullPageUrl: await pageInfo.getFullPageUrl(),
        }),
    }
    const annotationsFunctions = {
        createHighlight: (analyticsEvent?: AnalyticsEvent<'Highlights'>) => (
            shouldShare: boolean,
        ) =>
            highlightRenderer.saveAndRenderHighlight({
                ...annotationFunctionsParams,
                analyticsEvent,
                currentUser,
                shouldShare,
            }),
        createAnnotation: (analyticsEvent?: AnalyticsEvent<'Annotations'>) => (
            shouldShare: boolean,
            showSpacePicker?: boolean,
        ) =>
            highlightRenderer.saveAndRenderHighlightAndEditInSidebar({
                ...annotationFunctionsParams,
                showSpacePicker,
                analyticsEvent,
                currentUser,
                shouldShare,
            }),
        askAI: () => (highlightedText: string) => {
            inPageUI.showSidebar({
                action: 'show_page_summary',
                highlightedText: highlightedText,
            })
        },
    }

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

        if (
            isSubscribed.status === 'active' ||
            isSubscribed.status === 'already-setup'
        ) {
            if (isSubscribed.planLimit) {
                await upgradePlan(isSubscribed.planLimit)
            }
        }
    }
    if (
        fullPageUrl === 'https://memex.garden/upgradeStaging' ||
        fullPageUrl === 'https://memex.garden/upgrade' ||
        fullPageUrl === 'https://memex.garden/' ||
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

    if (
        fullPageUrl.includes('memex.garden') &&
        document.body.innerText.includes(
            'Icons by Smashicons from Flaticons.com',
        )
    ) {
        browser.runtime.sendMessage({ reloadTab: true })
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
                getRemoteFunction: remoteFunction,
                highlighter: highlightRenderer,
                annotations: annotationsBG,
                annotationsCache,
                tags: tagsBG,
                customLists: collectionsBG,
                activityIndicatorBG: runInBackground(),
                contentSharing: contentSharingBG,
                bookmarks: runInBackground(),
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
                currentUser,
                annotationsCache,
                highlighter: highlightRenderer,
                authBG,
                annotationsBG,
                summarizeBG,
                syncSettingsBG,
                contentSharingBG,
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
            })
            components.sidebar?.resolve()
        },
        async registerTooltipScript(execute): Promise<void> {
            await execute({
                inPageUI,
                summarizeBG,
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
    await loadCacheDataPromise
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
            await highlightRenderer.highlightAndScroll(unifiedAnnotation)
        },
        createHighlight: annotationsFunctions.createHighlight({
            category: 'Highlights',
            action: 'createFromContextMenu',
        }),
        removeHighlights: async () => highlightRenderer.resetHighlightsStyles(),
        createAnnotation: annotationsFunctions.createAnnotation({
            category: 'Annotations',
            action: 'createFromContextMenu',
        }),
        askAI: annotationsFunctions.askAI(),
        teardownContentScripts: async () => {
            await inPageUI.hideHighlights()
            await inPageUI.hideSidebar()
            await inPageUI.removeRibbon()
            await inPageUI.removeTooltip()
            resetKeyboardShortcuts()
        },
        handleHistoryStateUpdate: async (tabId) => {
            await inPageUI.reloadRibbon()
            highlightRenderer.resetHighlightsStyles()
            await bookmarks.autoSetBookmarkStatusInBrowserIcon(tabId)
            await sleepPromise(1000)
            await pageInfo.refreshIfNeeded()
            const isPageBlacklisted = await checkPageBlacklisted(fullPageUrl)
            if (isPageBlacklisted) {
                await inPageUI.removeRibbon()
            }
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

    // 7. Load components and associated content scripts if they are set to autoload
    // on each page.
    if (await tooltipUtils.getTooltipState()) {
        await inPageUI.setupTooltip()
    }

    const areHighlightsEnabled = await tooltipUtils.getHighlightsState()
    if (areHighlightsEnabled) {
        inPageUI.showHighlights()
        if (!annotationsCache.isEmpty) {
            inPageUI.loadComponent('sidebar')
        }
    }

    const isPageBlacklisted = await checkPageBlacklisted(fullPageUrl)
    const isSidebarEnabled =
        (await sidebarUtils.getSidebarState()) &&
        (pageInfo.isPdf ? isPdfViewerRunning : true)
    const pageActivityStatus = await pageActivityIndicatorBG.getPageActivityStatus(
        fullPageUrl,
    )

    if (
        (isSidebarEnabled && !isPageBlacklisted) ||
        pageActivityStatus !== 'no-activity'
    ) {
        await inPageUI.loadComponent('ribbon', {
            keepRibbonHidden: !isSidebarEnabled,
            showPageActivityIndicator: pageActivityStatus !== 'no-activity',
        })
    }

    injectYoutubeContextMenu(annotationsFunctions)
    setupWebUIActions({ contentScriptsBG, bgScriptBG, pageActivityIndicatorBG })
    return inPageUI
}

type ContentScriptLoader = (component: ContentScriptComponent) => Promise<void>
export function createContentScriptLoader(args: {
    contentScriptsBG: ContentScriptsInterface<'caller'>
    loadRemotely: boolean
}) {
    const remoteLoader: ContentScriptLoader = async (
        component: ContentScriptComponent,
    ) => {
        await args.contentScriptsBG.injectContentScriptComponent({
            component,
        })
    }

    const localLoader: ContentScriptLoader = async (
        component: ContentScriptComponent,
    ) => {
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

    constructor(
        public options?: { getContentFingerprints?: GetContentFingerprints },
    ) {}

    async refreshIfNeeded() {
        if (window.location.href === this._href) {
            return
        }
        await sleepPromise(1000)
        this.isPdf = isUrlPDFViewerUrl(window.location.href, {
            runtimeAPI: runtime,
        })
        const fullUrl = getUnderlyingResourceUrl(window.location.href)
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

    getFullPageUrl = async () => {
        await this.refreshIfNeeded()
        return this._identifier.fullUrl
    }

    getPageTitle = () => {
        return document.title
    }

    getNormalizedPageUrl = async () => {
        await this.refreshIfNeeded()
        return this._identifier.normalizedUrl
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
                annotationsFunctions.createAnnotation()(false, false)
            newEntry.innerHTML = `<div class="ytp-menuitem-icon"><img src=${icon} style="height: 23px; padding-left: 2px; display: flex; width: auto"/></div><div class="ytp-menuitem-label" style="white-space: nowrap">Add Note to timestamp with Memex</div>`
            panel.prepend(newEntry)
            // panel.style.height = "320px"
            observer.disconnect()
        }
    })

    observer.observe(document, config)
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

    document.addEventListener(MEMEX_OPEN_LINK_EVENT_NAME, async (event) => {
        const detail = event.detail as MemexOpenLinkDetail
        confirmRequest(detail.requestId)

        // Handle local PDFs first (memex.cloud URLs)
        if (isPagePdf({ url: detail.originalPageUrl })) {
            await args.bgScriptBG.openOverviewTab({ missingPdf: true })
            return
        }

        // TODO: more robust way of checking this?
        // Handle remote PDFs next (non-memex.cloud URLs with .pdf ext)
        if (detail.originalPageUrl.endsWith('.pdf')) {
            await args.contentScriptsBG.openPdfInViewer({
                fullPdfUrl: detail.originalPageUrl,
            })
            return
        }

        await args.contentScriptsBG.openPageWithSidebarInSelectedListMode({
            fullPageUrl: detail.originalPageUrl,
            sharedListId: detail.sharedListId,
        })
    })
}
