import 'core-js'
import { setupScrollReporter } from 'src/activity-logger/content_script'
import { setupPageContentRPC } from 'src/page-analysis/content_script'
import { shouldIncludeSearchInjection } from 'src/search-injection/detection'
import {
    loadAnnotationWhenReady,
    setupRemoteDirectLinkFunction,
} from 'src/direct-linking/content_script'
import { sniffWordpressWorldbrainUser } from 'src/backup-restore/content_script'
import { runInBackground } from 'src/util/webextensionRPC'
import { ContentScriptRegistry } from './types'
import { ContentScriptsInterface } from '../background/types'
import { ContentScriptComponent } from '../types'

export function main() {
    const contentScriptRegistry: ContentScriptRegistry = {
        async registerRibbonScript(
            execute: () => Promise<void>,
        ): Promise<void> {
            execute()
        },
        async registerHighlightingScript(
            execute: () => Promise<void>,
        ): Promise<void> {
            execute()
        },
        async registerSidebarScript(
            execute: () => Promise<void>,
        ): Promise<void> {
            execute()
        },
        async registerTooltipScript(
            execute: () => Promise<void>,
        ): Promise<void> {
            execute()
        },
    }
    window['contentScriptRegistry'] = contentScriptRegistry

    const loadContentScript = createContentScriptLoader()
    if (shouldIncludeSearchInjection(window.location.hostname)) {
        loadContentScript('search_injection')
    }

    setupScrollReporter()
    setupPageContentRPC()
    loadAnnotationWhenReady()
    setupRemoteDirectLinkFunction()
    setupOnDemandInPageUi(loadContentScript)

    if (window.location.hostname === 'worldbrain.io') {
        sniffWordpressWorldbrainUser()
    }
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
