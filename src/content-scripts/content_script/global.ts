import 'core-js'
import { EventEmitter } from 'events'
// import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { setupScrollReporter } from 'src/activity-logger/content_script'
import { setupPageContentRPC } from 'src/page-analysis/content_script'
import { shouldIncludeSearchInjection } from 'src/search-injection/detection'
import {
    loadAnnotationWhenReady,
    setupRemoteDirectLinkFunction,
} from 'src/direct-linking/content_script'
import {
    runInBackground,
    makeRemotelyCallableType,
    remoteFunction,
    RemoteFunctionRegistry,
} from 'src/util/webextensionRPC'
import { Resolvable, resolvablePromise } from 'src/util/resolvable'
import { ContentScriptRegistry } from './types'
import { ContentScriptsInterface } from '../background/types'
import { ContentScriptComponent } from '../types'
import { initKeyboardShortcuts } from 'src/in-page-ui/keyboard-shortcuts/content_script'
import { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import {
    createAnnotationWithSidebar,
    HighlightRenderer,
    renderAnnotationCacheChanges,
    saveAndRenderHighlightFromTooltip,
} from 'src/highlighting/ui/highlight-interactions'
import {
    InPageUIComponent,
    SharedInPageUIInterface,
} from 'src/in-page-ui/shared-state/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { AnnotationInterface } from 'src/direct-linking/background/types'
import { ActivityLoggerInterface } from 'src/activity-logger/background/types'
import { SearchInterface } from 'src/search/background/types'
import ToolbarNotifications from 'src/toolbar-notification/content_script'
import { AnnotationFunctions } from 'src/in-page-ui/tooltip/types'
import * as tooltipUtils from 'src/in-page-ui/tooltip/utils'
import * as constants from '../constants'
import { SharedInPageUIState } from 'src/in-page-ui/shared-state/shared-in-page-ui-state'
import { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { createAnnotationsCache } from 'src/annotations/annotations-cache'

// TODO:(page-indexing)[high] Fix this with a proper restructuring of how pages are indexed
setupPageContentRPC()

// Content Scripts are separate bundles of javascript code that can be loaded
// on demand by the browser, as needed. This main function manages the initialisation
// and dependencies of content scripts.

export async function main() {
    const getPageUrl = () => window.location.href
    const getPageTitle = () => document.title

    // 1. Create a local object with promises to track each content script
    // initialisation and provide a function which can initialise a content script
    // or ignore if already loaded.
    const components: {
        ribbon?: Resolvable<void>
        sidebar?: Resolvable<void>
        tooltip?: Resolvable<void>
    } = {}
    async function loadComponent(component: InPageUIComponent) {
        if (!components[component]) {
            components[component] = resolvablePromise<void>()
            loadContentScript(component)
        }
        return components[component]!
    }

    // 2. Initialise dependencies required by content scripts
    const currentTab = await getCurrentTab()
    const annotationsBG = runInBackground<AnnotationInterface<'caller'>>()
    const tagsBG = runInBackground<RemoteTagsInterface>()
    const remoteFunctionRegistry = new RemoteFunctionRegistry()
    const annotationsManager = new AnnotationsManager()
    const toolbarNotifications = new ToolbarNotifications()
    toolbarNotifications.registerRemoteFunctions(remoteFunctionRegistry)
    const highlightRenderer = new HighlightRenderer()
    const highlighter = new HighlightRenderer()

    // 3. Creates an instance of the InPageUI manager class to encapsulate
    // business logic of initialising and hide/showing components.
    const inPageUI = new SharedInPageUIState({
        loadComponent,
        annotations: annotationsBG,
        highlighter,
        pageUrl: currentTab.url,
    })

    const annotationsCache = createAnnotationsCache({
        tags: tagsBG,
        annotations: annotationsBG,
    })
    annotationsCache.load(getPageUrl())

    const annotationsFunctions = {
        createHighlight: () =>
            saveAndRenderHighlightFromTooltip({
                annotationsCache,
                getUrlAndTitle: () => ({
                    title: getPageTitle(),
                    pageUrl: getPageUrl(),
                }),
                renderer: highlightRenderer,
                getSelection: () => document.getSelection(),
                onClickHighlight: ({ annotationUrl }) =>
                    inPageUI.showSidebar({
                        annotationUrl,
                        action: 'show_annotation',
                    }),
            }),
        createAnnotation: () =>
            createAnnotationWithSidebar({
                getSelection: () => document.getSelection(),
                getUrlAndTitle: () => ({
                    title: getPageTitle(),
                    pageUrl: getPageUrl(),
                }),
                inPageUI,
            }),
    }

    // 4. Create a contentScriptRegistry object with functions for each content script
    // component, that when run, initialise the respective component with it's
    // dependencies
    const contentScriptRegistry: ContentScriptRegistry = {
        async registerRibbonScript(execute): Promise<void> {
            await execute({
                inPageUI,
                annotationsManager,
                getRemoteFunction: remoteFunction,
                highlighter,
                annotations: annotationsBG,
                currentTab,
                tags: tagsBG,
                customLists: runInBackground<RemoteCollectionsInterface>(),
                bookmarks: runInBackground<BookmarksInterface>(),
                activityLogger: runInBackground<ActivityLoggerInterface>(),
                tooltip: {
                    getState: tooltipUtils.getTooltipState,
                    setState: tooltipUtils.setTooltipState,
                },
                highlights: {
                    getState: tooltipUtils.getHighlightsState,
                    setState: tooltipUtils.setHighlightsState,
                },
            })
            components.ribbon!.resolve()
        },
        async registerHighlightingScript(execute): Promise<void> {
            execute() // TODO(sidebar-refactor) - this should take highlights / annotations deps but it doesn't, code smell, something needs refactoring
        },
        async registerSidebarScript(execute): Promise<void> {
            await execute({
                events: new EventEmitter() as AnnotationsSidebarInPageEventEmitter,
                initialState: inPageUI.componentsShown.sidebar
                    ? 'visible'
                    : 'hidden',
                inPageUI,
                annotationsCache,
                highlighter,
                annotations: annotationsBG,
                tags: tagsBG,
                pageUrl: currentTab.url,
                customLists: runInBackground<RemoteCollectionsInterface>(),
                searchResultLimit: constants.SIDEBAR_SEARCH_RESULT_LIMIT,
            })
            components.sidebar!.resolve()
        },
        async registerTooltipScript(execute): Promise<void> {
            await execute({
                inPageUI,
                toolbarNotifications,
                ...annotationsFunctions,
            })
            components.tooltip!.resolve()
        },
    }

    window['contentScriptRegistry'] = contentScriptRegistry

    // 5. Registers remote functions that can be used to interact with components
    // in this tab.
    // TODO:(remote-functions) Move these to the inPageUI class too
    makeRemotelyCallableType<InPageUIContentScriptRemoteInterface>({
        showSidebar: inPageUI.showSidebar.bind(inPageUI),
        showRibbon: inPageUI.showRibbon.bind(inPageUI),
        insertRibbon: async () => inPageUI.loadComponent('ribbon'),
        removeRibbon: async () => inPageUI.removeRibbon(),
        insertOrRemoveRibbon: async () => inPageUI.toggleRibbon(),
        updateRibbon: async () => inPageUI.updateRibbon(),
        showContentTooltip: async () => inPageUI.showTooltip(),
        insertTooltip: async () => inPageUI.showTooltip(),
        removeTooltip: async () => inPageUI.removeTooltip(),
        insertOrRemoveTooltip: async () => inPageUI.toggleTooltip(),
        goToHighlight: async (annotation, pageAnnotations) => {
            await highlighter.renderHighlights(
                pageAnnotations,
                annotationsBG.toggleSidebarOverlay,
            )
            await highlighter.highlightAndScroll(annotation)
        },
        createHighlight: annotationsFunctions.createHighlight,
        createAnnotation: annotationsFunctions.createAnnotation,
    })

    // 6. Setup other interactions with this page (things that always run)
    setupScrollReporter()
    loadAnnotationWhenReady()
    setupRemoteDirectLinkFunction()
    initKeyboardShortcuts({
        inPageUI,
        ...annotationsFunctions,
    })
    const loadContentScript = createContentScriptLoader()
    if (shouldIncludeSearchInjection(window.location.hostname)) {
        loadContentScript('search_injection')
    }

    // 7. Load components and associated content scripts if they are set to autoload
    // on each page.
    if (await tooltipUtils.getTooltipState()) {
        await inPageUI.setupTooltip()
    }

    const areHighlightsEnabled = await tooltipUtils.getHighlightsState()
    if (areHighlightsEnabled) {
        // todo (sidebar-refactor) remove show highlight logic
        const showHighlights = await inPageUI.showHighlights()

        renderAnnotationCacheChanges({
            cacheChanges: annotationsCache.annotationChanges,
            renderer: highlightRenderer,
            onClickHighlight: ({ annotationUrl }) =>
                inPageUI._emitAction({
                    action: 'show_annotation',
                    annotationUrl,
                    type: 'sidebarAction',
                }),
        })

        if (showHighlights) {
            await inPageUI.loadComponent('sidebar')
            await inPageUI.loadComponent('ribbon')
        }
    }

    // global['worldbrainMemex'] = {
    //     inPageUI,
    //     controllers,
    // }
}

type ContentScriptLoader = (component: ContentScriptComponent) => Promise<void>
export function createContentScriptLoader() {
    const loader: ContentScriptLoader = async (
        component: ContentScriptComponent,
    ) => {
        await runInBackground<
            ContentScriptsInterface<'caller'>
        >().injectContentScriptComponent({
            component,
        })
    }
    return loader
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

const getCurrentTab = (() => {
    let currentTab: { id: number; url: string }
    return async () => {
        if (!currentTab) {
            currentTab = await runInBackground<
                ContentScriptsInterface<'caller'>
            >().getCurrentTab()
        }
        return currentTab
    }
})()

main()
