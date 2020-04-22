import 'core-js'
import { setupScrollReporter } from 'src/activity-logger/content_script'
import { setupPageContentRPC } from 'src/page-analysis/content_script'
import { shouldIncludeSearchInjection } from 'src/search-injection/detection'
import {
    loadAnnotationWhenReady,
    setupRemoteDirectLinkFunction,
} from 'src/direct-linking/content_script'
import { sniffWordpressWorldbrainUser } from 'src/backup-restore/content_script'
import {
    runInBackground,
    makeRemotelyCallableType,
    remoteFunction,
} from 'src/util/webextensionRPC'
import { Resolvable, resolvablePromise } from 'src/util/resolvable'
import { ContentScriptRegistry } from './types'
import { ContentScriptsInterface } from '../background/types'
import { ContentScriptComponent } from '../types'
import { initKeyboardShortcuts } from 'src/in-page-ui/keyboard-shortcuts/content_script'
import { InPageUI } from 'src/in-page-ui/shared-state'
import { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { RibbonControllerInterface } from 'src/in-page-ui/ribbon/types'
import { SidebarControllerInterface } from 'src/in-page-ui/sidebar/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { HighlightInteraction } from 'src/highlighting/ui/highlight-interactions'

export function main() {
    const controllers: {
        ribbon?: Resolvable<RibbonControllerInterface>
        sidebar?: Resolvable<SidebarControllerInterface>
    } = {}
    async function getController<
        Which extends
            | { type: RibbonControllerInterface; component: 'ribbon' }
            | { type: SidebarControllerInterface; component: 'sidebar' }
    >(component: Which['component']): Promise<Which['type']> {
        if (!controllers[component]) {
            controllers[component] = resolvablePromise<Which['type']>() as any
            loadContentScript(component)
        }
        return controllers[component]! as Promise<Which['type']>
    }

    const annotationsManager = new AnnotationsManager()
    const highlighter = new HighlightInteraction()

    const contentScriptRegistry: ContentScriptRegistry = {
        async registerRibbonScript(execute): Promise<void> {
            const ribbon = await execute({
                inPageUI,
                annotationsManager,
                getRemoteFunction: remoteFunction,
                highlighter,
                currentTab: await getCurrentTab(),
            })
            controllers.ribbon!.resolve(ribbon.ribbonController)
        },
        async registerHighlightingScript(execute): Promise<void> {
            execute()
        },
        async registerSidebarScript(execute): Promise<void> {
            const sidebar = await execute({
                annotationsManager,
                getRemoteFunction: remoteFunction,
                highlighter,
                currentTab: await getCurrentTab(),
            })
            controllers.sidebar!.resolve(sidebar.sidebarController)
        },
        async registerTooltipScript(execute): Promise<void> {
            execute()
        },
    }
    window['contentScriptRegistry'] = contentScriptRegistry

    const inPageUI = new InPageUI({
        ribbonController: {
            showRibbon: async () => {
                ;(
                    await getController<{
                        type: RibbonControllerInterface
                        component: 'ribbon'
                    }>('ribbon')
                ).showRibbon()
            },
            hideRibbon: async () => {
                ;(
                    await getController<{
                        type: RibbonControllerInterface
                        component: 'ribbon'
                    }>('ribbon')
                ).hideRibbon()
            },
        },
        sidebarController: {
            showSidebar: async () => {
                ;(
                    await getController<{
                        type: SidebarControllerInterface
                        component: 'sidebar'
                    }>('sidebar')
                ).showSidebar()
            },
            hideSidebar: async () => {
                ;(
                    await getController<{
                        type: SidebarControllerInterface
                        component: 'sidebar'
                    }>('sidebar')
                ).hideSidebar()
            },
        },
    })
    makeRemotelyCallableType<InPageUIContentScriptRemoteInterface>({
        showSidebar: async () => inPageUI.showSidebar(),
    })

    const loadContentScript = createContentScriptLoader()
    if (shouldIncludeSearchInjection(window.location.hostname)) {
        loadContentScript('search_injection')
    }

    setupScrollReporter()
    setupPageContentRPC()
    loadAnnotationWhenReady()
    setupRemoteDirectLinkFunction()
    setupOnDemandInPageUi(() => getController('ribbon'))
    initKeyboardShortcuts(inPageUI)

    // if (window.location.hostname === 'worldbrain.io') {
    //     sniffWordpressWorldbrainUser()
    // }

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

export function setupOnDemandInPageUi(loadRibbon: () => void) {
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
