import 'babel-polyfill'
import { setupScrollReporter } from '../activity-logger/content_script'
import { setupPageContentRPC } from 'src/page-analysis/content_script'
import { shouldIncludeSearchInjection } from '../search-injection/detection'
import {
    loadAnnotationWhenReady,
    setupRemoteDirectLinkFunction,
} from 'src/direct-linking/content_script'
import { sniffWordpressWorldbrainUser } from 'src/backup-restore/content_script'
import { remoteFunction } from 'src/util/webextensionRPC'
import { ContentScriptRegistry, ContentScript } from './types'

export function main() {
    const contentScriptRegistry: ContentScriptRegistry = {
        async registerInPageUIScript(runInPageUI) {
            await runInPageUI()
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

type ContentScriptLoader = (component: ContentScript) => Promise<void>
export function createContentScriptLoader() {
    const loader: ContentScriptLoader = async (component: ContentScript) => {
        await remoteFunction('injectContent')({
            scriptPaths: [`/content_script_${component}.js`],
            // cssPaths: [`/content_script_${component}.css`]
        })
    }
    return loader
}

export function setupOnDemandInPageUi(loadContentScript: ContentScriptLoader) {
    const listener = (event: MouseEvent) => {
        if (event.clientX > window.innerWidth - 200) {
            console.log('load in page UI')
            loadContentScript('in_page_ui')
            document.removeEventListener('mousemove', listener)
        }
    }
    document.addEventListener('mousemove', listener)
}

main()
