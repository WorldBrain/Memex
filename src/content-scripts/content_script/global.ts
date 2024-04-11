import { EventEmitter } from 'events'
import type { ContentIdentifier } from '@worldbrain/memex-common/lib/page-indexing/types'
import {
    injectMemexExtDetectionEl,
    removeMemexExtDetectionEl,
} from '@worldbrain/memex-common/lib/common-ui/utils/content-script'
import {
    MemexOpenLinkDetail,
    MemexRequestHandledDetail,
    MEMEX_OPEN_LINK_EVENT_NAME,
    MEMEX_REQUEST_HANDLED_EVENT_NAME,
} from '@worldbrain/memex-common/lib/services/memex-extension'

import { shouldIncludeSearchInjection } from 'src/search-injection/detection'
import {
    remoteFunction,
    runInBackground,
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
import type { AnnotationInterface } from 'src/annotations/background/types'
import * as tooltipUtils from 'src/in-page-ui/tooltip/utils'
import * as sidebarUtils from 'src/sidebar-overlay/utils'
import * as constants from '../constants'
import { SharedInPageUIState } from 'src/in-page-ui/shared-state/shared-in-page-ui-state'
import type { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { PageAnnotationsCache } from 'src/annotations/cache'
import type { AnalyticsEvent } from 'src/analytics/types'
import analytics from 'src/analytics'
import { main as highlightMain } from 'src/content-scripts/content_script/highlights'
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
import {
    AIActionAllowed,
    pageActionAllowed,
} from 'src/util/subscriptions/storage'
import { sleepPromise } from 'src/util/promises'
import browser from 'webextension-polyfill'
import initSentry, { captureException, setUserContext } from 'src/util/raven'
import { HIGHLIGHT_COLOR_KEY } from 'src/highlighting/constants'
import { DEFAULT_HIGHLIGHT_COLOR } from '@worldbrain/memex-common/lib/annotations/constants'
import { createAnnotation } from 'src/annotations/annotation-save-logic'
import { generateAnnotationUrl } from 'src/annotations/utils'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { HighlightRenderer } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/renderer'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import checkBrowser from 'src/util/check-browser'
import { getTelegramUserDisplayName } from '@worldbrain/memex-common/lib/telegram/utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { RGBAColor, UnifiedList } from 'src/annotations/cache/types'
import {
    trackAnnotationCreate,
    trackPageActivityIndicatorHit,
} from '@worldbrain/memex-common/lib/analytics/events'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import {
    PdfScreenshot,
    promptPdfScreenshot,
} from '@worldbrain/memex-common/lib/pdf/screenshots/selection'
import { processCommentForImageUpload } from '@worldbrain/memex-common/lib/annotations/processCommentForImageUpload'
import { theme } from 'src/common-ui/components/design-library/theme'
import { PDFRemoteInterface } from 'src/pdf/background/types'
import { HIGHLIGHT_COLORS_DEFAULT } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/constants'
import { PKMSyncBackgroundModule } from 'src/pkm-integrations/background'
import { injectTelegramCustomUI } from './injectionUtils/telegram'
import { renderSpacesBar } from './injectionUtils/utils'
import { getTimestampedNoteWithAIsummaryForYoutubeNotes } from './injectionUtils/youtube'
import {
    injectTwitterProfileUI,
    trackTwitterMessageList,
} from './injectionUtils/twitter'
import { injectSubstackButtons } from './injectionUtils/substack'
import { extractRawPageContent } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/extract-page-content'
import { extractRawPDFContent } from 'src/page-analysis/content_script/extract-page-content'
import type { ActivityIndicatorInterface } from 'src/activity-indicator/background'
import { createUIServices } from 'src/services/ui'
import type { ImageSupportInterface } from 'src/image-support/background/types'
import type { ContentConversationsInterface } from 'src/content-conversations/background/types'
import type { InPageUIComponent } from 'src/in-page-ui/shared-state/types'
import type { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import type { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { InPageUIInterface } from 'src/in-page-ui/background/types'
import { Storage } from 'webextension-polyfill'
import { PseudoSelection } from '@worldbrain/memex-common/lib/in-page-ui/types'

// Content Scripts are separate bundles of javascript code that can be loaded
// on demand by the browser, as needed. This main function manages the initialisation
// and dependencies of content scripts.

export async function main(
    params: {
        loadRemotely?: boolean
        getContentFingerprints?: GetContentFingerprints
        htmlElToCanvasEl?: (el: HTMLElement) => Promise<HTMLCanvasElement>
    } = {},
) {
    const isRunningInFirefox = checkBrowser() === 'firefox'
    if (!isRunningInFirefox) {
        initSentry({})
    }
    params.loadRemotely = params.loadRemotely ?? true

    setupRpcConnection({
        browserAPIs: browser,
        sideName: 'content-script-global',
        role: 'content',
    })
    // TODO: potential are for improvement, setup RPC earlier or later

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

    ////////////////////////////////////////////
    // INITIALISE ALL VARIABLES AND FUNCTIONS
    ////////////////////////////////////////////
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
                    highlightRenderer.removeAnnotationHighlight({
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

    const pageInfo = new PageInfo(params)

    // 1. Create a local object with promises to track each content script
    // initialisation and provide a function which can initialise a content script
    // or ignore if already loaded.
    const components: { [C in InPageUIComponent]?: Resolvable<void> } = {}

    // 2. Initialise dependencies required by content scripts
    const analyticsBG = runInBackground<AnalyticsCoreInterface>()
    const authBG = runInBackground<AuthRemoteFunctionsInterface>()
    const bgScriptBG = runInBackground<RemoteBGScriptInterface>()
    const pkmSyncBG = runInBackground<PKMSyncBackgroundModule>()
    const summarizeBG = runInBackground<SummarizationInterface<'caller'>>()
    const annotationsBG = runInBackground<AnnotationInterface<'caller'>>()
    const pageIndexingBG = runInBackground<PageIndexingInterface<'caller'>>()
    const contentSharingBG = runInBackground<ContentSharingInterface>()
    const copyPasterBG = runInBackground<RemoteCopyPasterInterface>()
    const imageSupportBG = runInBackground<ImageSupportInterface<'caller'>>()
    const contentConversationsBG = runInBackground<
        ContentConversationsInterface
    >()
    const contentSharingByTabsBG = runInBackground<
        RemoteContentSharingByTabsInterface<'caller'>
    >()
    const contentScriptsBG = runInBackground<
        ContentScriptsInterface<'caller'>
    >()
    const syncSettingsBG = runInBackground<RemoteSyncSettingsInterface>()
    const collectionsBG = runInBackground<RemoteCollectionsInterface>()
    const pageActivityIndicatorBG = runInBackground<
        RemotePageActivityIndicatorInterface
    >()
    const activityIndicatorBG = runInBackground<ActivityIndicatorInterface>()
    const pdfBG = runInBackground<PDFRemoteInterface>()
    const annotationsManager = new AnnotationsManager()

    // loadInitialSettings
    const syncSettings = createSyncSettingsStore({
        syncSettingsBG: syncSettingsBG,
    })
    const isAutoAddStorage = await syncSettings.extension.get(
        'shouldAutoAddSpaces',
    )

    // 2.5 load cache
    const _currentUser = await authBG.getCurrentUser()
    if (!isRunningInFirefox) {
        setUserContext(_currentUser)
    }
    const currentUser: UserReference = _currentUser
        ? { type: 'user-reference', id: _currentUser.id }
        : null
    const fullPageUrl = await pageInfo.getFullPageUrl()
    const annotationsCache = new PageAnnotationsCache({})

    const loadCacheDataPromise = hydrateCacheForPageAnnotations({
        fullPageUrl,
        user: currentUser,
        cache: annotationsCache,
        bgModules: {
            annotations: annotationsBG,
            customLists: collectionsBG,
            syncSettings: syncSettingsBG,
            contentSharing: contentSharingBG,
            pageActivityIndicator: pageActivityIndicatorBG,
        },
    })

    // TODO: This needs to move to an RPC call
    browser.runtime.onMessage.addListener(((request, sender, sendResponse) => {
        if (request.action === 'getImageData') {
            const imageUrl = request.srcUrl // URL of the image to get data for
            fetch(imageUrl)
                .then((response) => response.blob())
                .then((blob) => {
                    const reader = new FileReader()
                    reader.onloadend = () =>
                        sendResponse({ imageData: reader.result })
                    reader.readAsDataURL(blob) // Convert the blob to a data URL
                })
        }
        return true
    }) as any)

    // add listener for when a person is over the pricing limit for saved pages

    const counterStorageListener = async (
        changes: Record<string, Storage.StorageChange>,
    ) => {
        const COUNTER_STORAGE_KEY = '@status'

        const currentTabURL = ((await runInBackground<
            InPageUIInterface<'caller'>
        >().getCurrentTabURL()) as unknown) as string

        if (changes[COUNTER_STORAGE_KEY]?.newValue != null) {
            const oldValues = changes[COUNTER_STORAGE_KEY]?.oldValue
            const newValues = changes[COUNTER_STORAGE_KEY]?.newValue

            const counterQueriesHaveChanged = oldValues.cQ !== newValues.cQ
            const counterSavedHaveChanged = oldValues.c !== newValues.c

            if (!counterQueriesHaveChanged && !counterSavedHaveChanged) {
                return
            }

            let isAllowed = true
            let limitReachedNotif = null
            if (counterQueriesHaveChanged) {
                isAllowed = await AIActionAllowed(
                    analyticsBG,
                    'AIpowerup',
                    true,
                )
                limitReachedNotif = 'AI'
            }
            if (counterSavedHaveChanged) {
                isAllowed = await pageActionAllowed(
                    analyticsBG,
                    collectionsBG,
                    window.location.href,
                    true,
                )
                limitReachedNotif = 'Bookmarks'
            }

            if (!isAllowed) {
                if (currentTabURL?.includes(window.location.href)) {
                    inPageUI.loadOnDemandInPageUI({
                        component: 'upgrade-modal',
                        options: {
                            powerUpModalProps: {
                                limitReachedNotif: limitReachedNotif,
                                authBG: authBG,
                            },
                        },
                    })
                }
            }
        }
    }

    browser.storage.onChanged.addListener(counterStorageListener)

    // 3. Creates an instance of the InPageUI manager class to encapsulate
    // business logic of initialising and hide/showing components.
    const loadContentScript = createContentScriptLoader({
        contentScriptsBG,
        loadRemotely: params.loadRemotely,
    })
    const inPageUI = new SharedInPageUIState({
        getNormalizedPageUrl: pageInfo.getNormalizedPageUrl,
        loadComponent: async (component) => {
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

    const highlightRenderer = new HighlightRenderer({
        getDocument: () => document,
        isToolTipShown: () => {
            return inPageUI.componentsShown.tooltip
        },
        icons: (iconName) => theme({ variant: 'dark' }).icons[iconName],
        captureException,
        getUndoHistory: async () => {
            const storage = await browser.storage.local.get(UNDO_HISTORY)
            return storage[UNDO_HISTORY] ?? []
        },
        createHighlight: async (
            createHighlightselection,
            shouldShare,
            shouldCopyShareLink,
            drawRectangle,
        ) => {
            annotationsFunctions.createHighlight()(
                null,
                false,
                shouldCopyShareLink,
            )
        },
        setUndoHistory: async (undoHistory) =>
            browser.storage.local.set({
                [UNDO_HISTORY]: undoHistory,
            }),
        getHighlightColor: async () => {
            const colorSettings = await getHighlightColorSettings()
            const defaultColorSetting = colorSettings.find(
                (setting) => setting.id === 'default',
            )['color']

            return defaultColorSetting ?? DEFAULT_HIGHLIGHT_COLOR
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

            const syncSettings = createSyncSettingsStore({ syncSettingsBG })

            const shouldShareSettings = await syncSettings.extension.get(
                'shouldAutoAddSpaces',
            )

            let shouldShareAnnotation

            if (data.shouldShare && shouldShareSettings) {
                // this setting is here to inverse the "shift" action of the highlight and annotation buttons
                shouldShareAnnotation = false
            } else if (data.shouldShare && !shouldShareSettings) {
                shouldShareAnnotation = true
            } else if (shouldShareSettings) {
                shouldShareAnnotation = true
            }

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

            if (inPageUI.selectedList) {
                privacyLevel = data.shouldShare
                    ? AnnotationPrivacyLevels.SHARED
                    : AnnotationPrivacyLevels.PROTECTED
            } else {
                privacyLevel = shouldShareAnnotation
                    ? AnnotationPrivacyLevels.SHARED
                    : AnnotationPrivacyLevels.PROTECTED
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
                color: data.color as RGBAColor,
            })

            const createPromise = (async () => {
                const bodyForSaving = await processCommentForImageUpload(
                    data.body,
                    data.fullPageUrl,
                    localId,
                    imageSupportBG,
                    false,
                )

                const {
                    savePromise,
                    remoteAnnotationId,
                } = await createAnnotation({
                    shareOpts: {
                        shouldShare:
                            shouldShareAnnotation || remoteListIds.length > 0,
                        shouldCopyShareLink: data.shouldCopyShareLink,
                    },
                    annotationsBG,
                    contentSharingBG,
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
                        color: data.color,
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

    // TODO: Type this
    async function saveHighlight(
        shouldShare: boolean,
        shouldCopyShareLink: boolean,
        screenshotAnchor?,
        screenshotImage?,
        imageSupport?,
        highlightColor?: HighlightColor,
        selection?: Selection | PseudoSelection,
    ): Promise<{ annotationId: AutoPk; createPromise: Promise<void> }> {
        const handleError = async (err: Error) => {
            captureException(err)
            await components.in_page_ui_injections
            inPageUI.loadOnDemandInPageUI({
                component: 'error-display',
                options: {
                    errorDisplayProps: {
                        errorMessage: err.message,
                        title: 'Error saving note',
                        blockedBackground: true,
                    },
                },
            })
        }

        try {
            const result = await highlightRenderer.saveAndRenderHighlight({
                currentUser,
                onClick: ({ annotationId, openInEdit }) => {
                    if (openInEdit || inPageUI.componentsShown.sidebar) {
                        return inPageUI.showSidebar({
                            annotationCacheId: annotationId.toString(),
                            action: 'edit_annotation',
                        })
                    } else {
                        inPageUI.events.emit('tooltipAction', {
                            annotationCacheId: annotationId.toString(),
                        })
                    }
                },
                getSelection: selection ?? null,
                getFullPageUrl: async () => pageInfo.getFullPageUrl(),
                isPdf: pageInfo.isPdf,
                shouldShare,
                shouldCopyShareLink,
                screenshotAnchor,
                screenshotImage,
                imageSupport,
                highlightColor,
            })
            const annotationId = result.annotationId
            const createPromise = result.createPromise.catch(handleError)

            return { annotationId, createPromise }
        } catch (err) {
            await handleError(err)
            throw err
        }
    }

    const captureScreenshot = () =>
        browser.tabs.captureVisibleTab(undefined, {
            format: 'jpeg',
            quality: 100,
        })

    const annotationsFunctions = {
        createHighlight: (
            analyticsEvent?: AnalyticsEvent<'Highlights'>,
        ) => async (
            selection: Selection,
            shouldShare: boolean,
            shouldCopyShareLink: boolean,
            drawRectangle?: boolean,
            highlightColorSetting?: HighlightColor,
            preventHideTooltip?: boolean,
        ) => {
            if (
                !(await pageActionAllowed(
                    analyticsBG,
                    collectionsBG,
                    window.location.href,
                    false,
                ))
            ) {
                return
            }
            const highlightColorSettingStorage = await getHighlightColorSettings()
            const highlightColor =
                highlightColorSetting ?? highlightColorSettingStorage[0]
            if (inPageUI.componentsShown.sidebar) {
                inPageUI.showSidebar({
                    action: 'show_annotation',
                })
            }
            let screenshotGrabResult: PdfScreenshot
            let annotationId = null
            if (
                isPdfViewerRunning &&
                window.getSelection().toString().length === 0
            ) {
                const pdfViewer = globalThis as any
                screenshotGrabResult = await promptPdfScreenshot(
                    document,
                    pdfViewer,
                    {
                        captureScreenshot,
                        htmlElToCanvasEl: params.htmlElToCanvasEl,
                    },
                )

                if (
                    screenshotGrabResult == null ||
                    screenshotGrabResult.anchor == null
                ) {
                    return
                }

                const results = await saveHighlight(
                    shouldShare,
                    shouldCopyShareLink,
                    screenshotGrabResult.anchor,
                    screenshotGrabResult.screenshot,
                    imageSupportBG,
                    highlightColor,
                )
                annotationId = results.annotationId
                await results.createPromise
            } else if (selection) {
                console.log('selectionhh', selection)
                const results = await saveHighlight(
                    shouldShare,
                    shouldCopyShareLink,
                    null,
                    null,
                    null,
                    highlightColor,
                    selection,
                )
                annotationId = results.annotationId
                await results.createPromise
            }

            // await inPageUI.hideTooltip()

            if (preventHideTooltip) {
                const styleSheet = document.createElement('style')
                styleSheet.type = 'text/css'
                styleSheet.innerText = `
                    @keyframes slideAndFade {
                        0% { transform: translateY(-5px); opacity: 0; }
                        10% { transform: translateY(10px); opacity: 1; }
                        90% { transform: translateY(10px); opacity: 1; }
                        100% { transform: translateY(-5px); opacity: 0; }
                    }`
                document.head.appendChild(styleSheet)

                const notification = document.createElement('div')
                notification.textContent = '🔗 Link copied to clipboard'
                notification.style.position = 'fixed'
                notification.style.top = '5px'
                notification.style.left = '50%'
                notification.style.transform = 'translateX(-50%)'
                notification.style.backgroundColor = '#12131B95'
                ;(notification.style as any).backdropFilter = 'blur(10px)'
                notification.style.color = 'white'
                notification.style.padding = '10px'
                notification.style.borderRadius = '5px'
                notification.style.zIndex = '1000'
                notification.style.textAlign = 'center'
                notification.style.animation = 'slideAndFade 4s ease-in-out'
                document.body.appendChild(notification)
                setTimeout(() => {
                    document.body.removeChild(notification)
                }, 2000)
            }
            if (analyticsBG) {
                try {
                    await trackAnnotationCreate(analyticsBG, {
                        annotationType: 'highlight',
                    })
                } catch (error) {
                    console.error(
                        `Error tracking space create event', ${error}`,
                    )
                }
            }

            return annotationId
        },
        createAnnotation: (
            analyticsEvent?: AnalyticsEvent<'Annotations'>,
        ) => async (
            selection: Selection | PseudoSelection,
            shouldShare: boolean,
            shouldCopyShareLink: boolean,
            showSpacePicker?: boolean,
            commentText?: string,
            highlightColorSetting?: HighlightColor,
        ) => {
            if (
                !(await pageActionAllowed(
                    analyticsBG,
                    collectionsBG,
                    window.location.href,
                    false,
                ))
            ) {
                return
            }

            const highlightColorSettingStorage = await getHighlightColorSettings()
            const highlightColor =
                highlightColorSetting ?? highlightColorSettingStorage[0]

            let screenshotGrabResult
            if (
                isPdfViewerRunning &&
                window.getSelection().toString().length === 0
            ) {
                const pdfViewer = globalThis as any
                screenshotGrabResult = await promptPdfScreenshot(
                    document,
                    pdfViewer,
                    {
                        captureScreenshot,
                        htmlElToCanvasEl: params.htmlElToCanvasEl,
                    },
                )

                if (
                    screenshotGrabResult == null ||
                    screenshotGrabResult.anchor == null
                ) {
                    return
                }

                const result = await saveHighlight(
                    shouldShare,
                    shouldCopyShareLink,
                    screenshotGrabResult.anchor,
                    screenshotGrabResult.screenshot,
                    imageSupportBG,
                    highlightColor,
                    selection,
                )

                const annotationId = result.annotationId
                const createPromise = result.createPromise
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
                await createPromise
            } else if (
                selection &&
                window.getSelection().toString().length > 0
            ) {
                const result = await saveHighlight(
                    shouldShare,
                    shouldCopyShareLink,
                    null,
                    null,
                    imageSupportBG,
                    highlightColor,
                    selection,
                )

                const annotationId = result.annotationId
                const createPromise = result.createPromise
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
                await createPromise
            } else if (window.location.href.includes('youtube.com')) {
                await inPageUI.showSidebar({
                    action: 'youtube_timestamp',
                    commentText: commentText,
                })
            }

            // await inPageUI.hideTooltip()
            if (analyticsBG) {
                // tracking highlight here too bc I determine annotations by them having content added, tracked elsewhere
                try {
                    await trackAnnotationCreate(analyticsBG, {
                        annotationType: 'highlight',
                    })
                } catch (error) {
                    console.error(
                        `Error tracking space create event', ${error}`,
                    )
                }
            }
        },
        askAI: () => (highlightedText: string, prompt: string) => {
            inPageUI.showSidebar({
                action: 'show_page_summary',
                highlightedText,
                prompt,
            })
            inPageUI.hideTooltip()
        },
        askAIwithMediaRange: () => (
            range: { from: number; to: number },
            prompt: string,
        ) => {
            inPageUI.showSidebar({
                action: 'add_media_range_to_ai_context',
                range,
                prompt,
            })
        },
        createTimestampWithAISummary: async (
            range: { from: number; to: number },
            prompt,
        ) => {
            inPageUI.showSidebar({
                action: 'create_youtube_timestamp_with_AI_summary',
                range,
                prompt,
            })
            inPageUI.hideTooltip()
        },
        openChapterSummary: async () => {
            inPageUI.showSidebar({
                action: 'open_chapter_summary',
            })
            inPageUI.hideTooltip()
        },
        createTimestampWithScreenshot: async () => {
            const targetContainer = document.getElementById('movie_player')
            const screenshotTarget = targetContainer.getElementsByClassName(
                'html5-main-video',
            )[0] as HTMLElement

            if (screenshotTarget) {
                const dataURL = await captureScreenshotFromHTMLVideo(
                    screenshotTarget,
                )
                inPageUI.showSidebar({
                    action: 'create_youtube_timestamp_with_screenshot',
                    imageData: dataURL,
                })
            }

            inPageUI.hideTooltip()
        },
        saveImageAsNewNote: async (imageData: string) => {
            inPageUI.showSidebar({
                action: 'save_image_as_new_note',
                imageData: imageData['imageData'],
            })
        },
    }

    async function captureScreenshotFromHTMLVideo(screenshotTarget) {
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

    async function getHighlightColorSettings() {
        const syncSettings = createSyncSettingsStore({ syncSettingsBG })
        const highlightColorStore = syncSettings.highlightColors
        let highlightColorJSON
        const highlightColors = await highlightColorStore.get('highlightColors')

        if (highlightColors) {
            highlightColorJSON = highlightColors
        } else {
            highlightColorJSON = HIGHLIGHT_COLORS_DEFAULT
            await highlightColorStore.set('highlightColors', highlightColorJSON)
        }
        return highlightColorJSON
    }
    async function saveHighlightColorSettings(newStateInput) {
        const syncSettings = createSyncSettingsStore({ syncSettingsBG })
        const highlightColorStore = syncSettings.highlightColors
        const newState = JSON.parse(newStateInput)
        await highlightColorStore.set('highlightColors', newState)

        return newState
    }
    async function maybeLoadOnDemandInPageUI() {
        if (
            shouldIncludeSearchInjection(
                window.location.hostname,
                window.location.href,
            )
        ) {
            await components.in_page_ui_injections
            inPageUI.loadOnDemandInPageUI({
                component: 'search-engine-integration',
            })
        } else if (window.location.href.includes('youtube.com')) {
            await components.in_page_ui_injections
            inPageUI.loadOnDemandInPageUI({
                component: 'youtube-integration',
            })
        }
    }

    // 4. Create a contentScriptRegistry object with functions for each content script
    // component, that when run, initialise the respective component with its
    // dependencies

    const contentScriptRegistry: ContentScriptRegistry = {
        async registerRibbonScript(execute) {
            await execute({
                inPageUI,
                currentUser,
                annotationsManager,
                highlighter: highlightRenderer,
                annotations: annotationsBG,
                annotationsCache,
                customLists: collectionsBG,
                authBG,
                bgScriptBG,
                analyticsBG,
                pageActivityIndicatorBG,
                activityIndicatorBG,
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
        async registerHighlightingScript(execute) {
            await execute({
                inPageUI,
                annotationsCache,
                highlightRenderer,
                annotations: annotationsBG,
                annotationsManager,
            })
            components.highlights?.resolve()
        },
        async registerSidebarScript(execute) {
            await execute({
                events: sidebarEvents,
                initialState: inPageUI.componentsShown.sidebar
                    ? 'visible'
                    : 'hidden',
                inPageUI,
                getCurrentUser: () => currentUser,
                annotationsCache,
                // inPageMode: true,
                highlighter: highlightRenderer,
                analyticsBG,
                authBG,
                annotationsBG,
                bgScriptBG,
                summarizeBG,
                pageIndexingBG,
                syncSettingsBG,
                imageSupportBG,
                contentSharingBG,
                contentConversationsBG,
                contentSharingByTabsBG,
                pageActivityIndicatorBG,
                customListsBG: collectionsBG,
                searchResultLimit: constants.SIDEBAR_SEARCH_RESULT_LIMIT,
                analytics,
                copyToClipboard,
                getFullPageUrl: pageInfo.getFullPageUrl,
                copyPaster,
                subscription,
                contentScriptsBG: runInBackground(),
                imageSupport: runInBackground(),
                pkmSyncBG: runInBackground(),
                getRootElement: null,
            })
            components.sidebar?.resolve()
        },
        async registerTooltipScript(execute) {
            await execute({
                inPageUI,
                createHighlight: annotationsFunctions.createHighlight({
                    category: 'Highlights',
                    action: 'createFromTooltip',
                }),
                createAnnotation: annotationsFunctions.createAnnotation({
                    category: 'Annotations',
                    action: 'createFromTooltip',
                }),
                askAI: annotationsFunctions.askAI(),
                getHighlightColorsSettings: () => getHighlightColorSettings(),
                saveHighlightColorsSettings: (newState) =>
                    saveHighlightColorSettings(newState),
                openPDFinViewer: async (originalPageURL) => {
                    await contentScriptsBG.openPdfInViewer({
                        fullPageUrl: originalPageURL,
                    })
                },
                annotationsBG,
                annotationsCache,
                contentSharingBG,
                imageSupportBG,
                authBG,
                spacesBG: collectionsBG,
                bgScriptsBG: bgScriptBG,
                analyticsBG,
                pageActivityIndicatorBG,
                localStorageAPI: browser.storage.local,
            })
            components.tooltip?.resolve()
        },
        async registerInPageUIInjectionScript(execute) {
            await execute({
                inPageUI,
                syncSettingsBG,
                syncSettings: createSyncSettingsStore({ syncSettingsBG }),
                requestSearcher: remoteFunction('search'),
                searchDisplayProps: {
                    activityIndicatorBG,
                    searchBG: runInBackground(),
                    pdfViewerBG: runInBackground(),
                    summarizeBG,
                    analyticsBG,
                    authBG,
                    annotationsBG,
                    pageIndexingBG,
                    contentShareBG: contentSharingBG,
                    contentShareByTabsBG: contentSharingByTabsBG,
                    pageActivityIndicatorBG,
                    listsBG: collectionsBG,
                    contentConversationsBG,
                    contentScriptsBG,
                    imageSupportBG,
                    copyPasterBG,
                    syncSettingsBG,
                    analytics,
                    document,
                    location,
                    history,
                    annotationsCache,
                    copyToClipboard,
                    tabsAPI: browser.tabs,
                    runtimeAPI: browser.runtime,
                    localStorage: browser.storage.local,
                    services: createUIServices(),
                    renderUpdateNotifBanner: () => null,
                    bgScriptBG: bgScriptBG,
                },
                upgradeModalProps: {
                    createCheckOutLink: bgScriptBG.createCheckoutLink,
                    browserAPIs: browser,
                    authBG: authBG,
                    limitReachedNotif: null,
                },
                annotationsFunctions,
            })
            components.in_page_ui_injections?.resolve()
        },
    }
    globalThis['contentScriptRegistry'] = contentScriptRegistry
    await inPageUI.loadComponent('in_page_ui_injections')

    await maybeLoadOnDemandInPageUI()

    const pageHasBookark =
        (await bookmarks.pageHasBookmark(fullPageUrl)) ||
        (await collectionsBG
            .fetchPageLists({ url: fullPageUrl })
            .then((lists) => lists.length > 0)) ||
        (await annotationsBG
            .getAllAnnotationsByUrl({ url: fullPageUrl })
            .then((annotations) => annotations.length > 0))

    const isPageBlacklisted = await checkPageBlacklisted(fullPageUrl)

    // 5. Registers remote functions that can be used to interact with components
    // in this tab.
    // TODO:(remote-functions) Move these to the inPageUI class too
    makeRemotelyCallableType<InPageUIContentScriptRemoteInterface>({
        extractRawPageContent: async (doc = document, url = location.href) => {
            if (isUrlPDFViewerUrl(url, { runtimeAPI: browser.runtime })) {
                return extractRawPDFContent(doc, url)
            }
            return extractRawPageContent(doc, url)
        },
        confirmTabScriptLoaded: async () => {},
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
            let unifiedAnnotation
            for (const id in annotationsCache.annotations.byId) {
                if (
                    annotationsCache.annotations.byId[id].localId ===
                    annotationCacheId
                ) {
                    unifiedAnnotation = annotationsCache.annotations.byId[id]
                    break
                }
            }

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
        saveImageAsNewNote: (imageData) =>
            annotationsFunctions.saveImageAsNewNote(imageData),
        createHighlight: (shouldShare, shouldCopyLink) =>
            annotationsFunctions.createHighlight({
                category: 'Highlights',
                action: 'createFromContextMenu',
            })(window.getSelection(), shouldShare, shouldCopyLink),
        removeHighlights: async () => highlightRenderer.resetHighlightsStyles(),
        teardownContentScripts: async () => {
            removeMemexExtDetectionEl()
            await inPageUI.hideHighlights()
            await inPageUI.hideSidebar()
            await inPageUI.removeRibbon()
            await inPageUI.removeTooltip()
            resetKeyboardShortcuts()
        },
        handleHistoryStateUpdate: async (tabId) => {
            if (isPdfViewerRunning) {
                return
            }
            await inPageUI.hideRibbon()
            await maybeLoadOnDemandInPageUI()
            await injectCustomUIperPage(
                annotationsFunctions,
                pkmSyncBG,
                collectionsBG,
                bgScriptBG,
                pageInfo,
                inPageUI,
            )

            // reload content script injections

            const isPageBlacklisted = await checkPageBlacklisted(fullPageUrl)
            if (isPageBlacklisted || !isSidebarEnabled) {
                await inPageUI.removeTooltip()
                await inPageUI.removeRibbon()
            } else {
                if (await tooltipUtils.getTooltipState()) {
                    await inPageUI.reloadComponent('tooltip')
                }
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

    // 7. check if highlights are enabled
    const areHighlightsEnabled = await tooltipUtils.getHighlightsState()

    // 8. initialise keyboard shortcuts
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
        getHighlightColorsSettings: getHighlightColorSettings,
        saveHighlightColorsSettings: saveHighlightColorSettings,
    })

    // 9. Check for page activity status

    const {
        status: pageActivityStatus,
    } = await pageActivityIndicatorBG.getPageActivityStatus(fullPageUrl)

    const hasActivity =
        pageActivityStatus === 'no-annotations' ||
        pageActivityStatus === 'has-annotations'

    ////////////////////////////////////////////
    // EXECUTE PROGRESSIVE LOADING SEQUENCES
    ////////////////////////////////////////////

    window['__annotationsCache'] = annotationsCache

    await loadCacheDataPromise
        .then(inPageUI.cacheLoadPromise.resolve)
        .catch(inPageUI.cacheLoadPromise.reject)

    // N.B. Building the highlighting script as a seperate content script results in ~6Mb of duplicated code bundle,
    // so it is included in this global content script where it adds less than 500kb.
    await contentScriptRegistry.registerHighlightingScript(highlightMain)

    if (areHighlightsEnabled) {
        inPageUI.showHighlights()
        if (!annotationsCache.isEmpty) {
            await inPageUI.loadComponent('sidebar')
        }
    }

    if (isSidebarEnabled && !isPageBlacklisted) {
        await inPageUI.loadComponent('ribbon', {
            keepRibbonHidden: !isSidebarEnabled,
            showPageActivityIndicator: hasActivity,
        })
        if (await tooltipUtils.getTooltipState()) {
            await inPageUI.loadComponent('tooltip')
        }
    } else {
        if (hasActivity) {
            await inPageUI.loadComponent('ribbon', {
                keepRibbonHidden: !isSidebarEnabled,
                showPageActivityIndicator: hasActivity,
            })
            if (await tooltipUtils.getTooltipState()) {
                await inPageUI.loadComponent('tooltip')
            }
        }
    }

    setupWebUIActions({ contentScriptsBG, bgScriptBG, pageActivityIndicatorBG })

    await bookmarks.setBookmarkStatusInBrowserIcon(pageHasBookark, fullPageUrl)

    if (isAutoAddStorage == null) {
        await syncSettings.extension.set('shouldAutoAddSpaces', true)
    }
    ////////////////////////////////////////////
    // ADD ANY LISTENERS
    ////////////////////////////////////////////
    document.addEventListener('keydown', (event) => {
        undoAnnotationHistory(event)
    })

    document.addEventListener('keyup', (event) => {
        keysPressed.filter((item) => item != event.key)
    })

    ////////////////////////////////////////////
    // CHECK CURRENT PAGE IF NEED BE TO INJECT CUSTOM UI
    ////////////////////////////////////////////

    await injectCustomUIperPage(
        annotationsFunctions,
        pkmSyncBG,
        collectionsBG,
        bgScriptBG,
        pageInfo,
        inPageUI,
    )

    // special case bc we want the listener to be active on page load
    if (window.location.href.includes('web.telegram.org/')) {
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
        (window.location.href.includes('twitter.com/') ||
            window.location.href.includes('x.com/')) &&
        !window.location.href.includes('/status/')
    ) {
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

    if (fullPageUrl === 'https://memex.garden/upgradeSuccessful') {
        const email = _currentUser?.email

        await sleepPromise(3000)
        await runInBackground<InPageUIInterface<'caller'>>().checkStripePlan(
            email,
        )
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

    if (analyticsBG && hasActivity) {
        try {
            await trackPageActivityIndicatorHit(analyticsBG)
        } catch (error) {
            console.error(`Error tracking space create event', ${error}`)
        }
    }

    return { inPageUI, pdfBG }
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
    private normalizedGmailFullUrl?: string

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
    normalizeGmailFullURL = async (url) => {
        let fullUrl = url

        if (
            url.includes('#search') ||
            url.includes('#inbox') ||
            url.includes('#sent') ||
            url.includes('#snoozed') ||
            url.includes('#drafts') ||
            url.includes('#imp') ||
            url.includes('#scheduled')
        ) {
            const parts = url.split('/')
            const mailId = parts[parts.length - 1]
            fullUrl = `https://mail.google.com/mail/#inbox/${mailId}`
            return fullUrl
        } else {
            return fullUrl
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
        } else if (window.location.href.includes('mail.google.com/mail')) {
            fullUrl = await this.normalizeGmailFullURL(fullUrl)
        }
        return fullUrl
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

// TODO: Move this stuff to in-page-uis CS
export async function injectCustomUIperPage(
    annotationsFunctions,
    pkmSyncBG,
    collectionsBG,
    bgScriptBG,
    pageInfo,
    inPageUI,
) {
    // if (window.location.hostname === 'www.youtube.com') {
    //     const existingButtons = document.getElementsByClassName(
    //         'memex-youtube-buttons',
    //     )[0]

    //     if (existingButtons) {
    //         existingButtons.remove()
    //     }
    //     loadYoutubeButtons(annotationsFunctions)
    // }

    const checkIfSubstackHeader = () => {
        const headerLinks = document.head.getElementsByTagName('link')
        for (let link of headerLinks) {
            if (link.href.startsWith('https://substackcdn.com')) {
                return true
            }
        }
    }
    if (
        window.location.hostname.includes('.substack.com') ||
        checkIfSubstackHeader()
    ) {
        const openSidebarInRabbitHole = async () => {
            inPageUI.showSidebar({
                action: 'rabbit_hole_open',
            })
        }

        injectSubstackButtons(
            pkmSyncBG,
            browser.storage,
            openSidebarInRabbitHole,
            browser.runtime,
        )
    }

    if (window.location.href.includes('web.telegram.org/')) {
        const existingContainer = document.getElementById(`spacesBarContainer`)

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
}
