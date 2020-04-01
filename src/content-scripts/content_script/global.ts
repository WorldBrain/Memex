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
} from 'src/util/webextensionRPC'
import { ContentScriptRegistry } from './types'
import { ContentScriptsInterface } from '../background/types'
import { ContentScriptComponent } from '../types'
import { initKeyboardShortcuts } from 'src/in-page-ui/keyboard-shortcuts/content_script'
import { InPageUI } from 'src/in-page-ui/shared-state'
import { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { RibbonControllerInterface } from 'src/in-page-ui/ribbon/types'
import { SidebarUIControllerInterface } from 'src/in-page-ui/sidebar/types'
import { Resolvable, resolvablePromise } from 'src/util/resolvable'

export function main() {
    const controllers: {
        ribbon?: Resolvable<RibbonControllerInterface>
        sidebar?: Resolvable<SidebarUIControllerInterface>
    } = {}
    async function getController<
        Which extends
            | { type: RibbonControllerInterface; component: 'ribbon' }
            | { type: SidebarUIControllerInterface; component: 'sidebar' }
    >(component: Which['component']): Promise<Which['type']> {
        if (!controllers[component]) {
            controllers[component] = resolvablePromise<Which['type']>() as any
            loadContentScript('sidebar')
        }
        return controllers[component]! as Promise<Which['type']>
    }

    const contentScriptRegistry: ContentScriptRegistry = {
        async registerRibbonScript(execute): Promise<void> {
            const ribbon = await execute()
            controllers.ribbon!.resolve(ribbon.ribbonController)
        },
        async registerHighlightingScript(execute): Promise<void> {
            execute()
        },
        async registerSidebarScript(execute): Promise<void> {
            const sidebar = await execute()
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
                        type: SidebarUIControllerInterface
                        component: 'sidebar'
                    }>('sidebar')
                ).showSidebar()
            },
            hideSidebar: async () => {
                ;(
                    await getController<{
                        type: SidebarUIControllerInterface
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
    setupOnDemandInPageUi(loadContentScript)
    initKeyboardShortcuts(inPageUI)

    if (window.location.hostname === 'worldbrain.io') {
        sniffWordpressWorldbrainUser()
    }

    global['worldbrainMemex'] = {
        inPageUI,
        controllers,
    }
    inPageUI.showSidebar()
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

export function setupOnDemandInPageUi(loadContentScript: ContentScriptLoader) {
    const listener = (event: MouseEvent) => {
        if (event.clientX > window.innerWidth - 200) {
            // console.log('load in page UI')
            // loadContentScript('in_page_ui')
            // document.removeEventListener('mousemove', listener)
        }
    }
    document.addEventListener('mousemove', listener)
}

main()
