import 'babel-polyfill'
import { RemoteFunctionRegistry } from './util/webextensionRPC'
import { setupScrollReporter } from './activity-logger/content_script'
import { setupPageContentRPC } from 'src/page-analysis/content_script'
import { initSearchInjection } from 'src/search-injection/content_script'
import AnnotationsManager from 'src/annotations/annotations-manager'
import initContentTooltip from 'src/content-tooltip/content_script'
import {
    loadAnnotationWhenReady,
    setupRemoteDirectLinkFunction,
} from 'src/direct-linking/content_script'
import initRibbonAndSidebar from './sidebar-overlay/content_script'
import { sniffWordpressWorldbrainUser } from 'src/backup-restore/content_script'
import ToolbarNotifications from 'src/toolbar-notification/content_script'
import initSocialIntegration from 'src/social-integration/content_script'
import configureStore from './sidebar-overlay/store'
import { initKeyboardShortcuts } from 'src/content_script_keyboard_shortcuts'
import { fetchAnnotationsForPageUrl } from 'src/annotations/actions'
import * as sidebarActs from 'src/sidebar-overlay/sidebar/actions'
import { initBasicStore } from 'src/popup/actions'

export function main() {
    setupScrollReporter()
    setupPageContentRPC()
    initSearchInjection()
    loadAnnotationWhenReady()
    setupRemoteDirectLinkFunction()

    if (window.location.hostname === 'worldbrain.io') {
        sniffWordpressWorldbrainUser()
    }

    const remoteFunctionRegistry = new RemoteFunctionRegistry()
    const toolbarNotifications = new ToolbarNotifications()
    const annotationsManager = new AnnotationsManager()
    const rootStore = configureStore()

    toolbarNotifications.registerRemoteFunctions(remoteFunctionRegistry)
    window['toolbarNotifications'] = toolbarNotifications

    initStore(rootStore)
    initContentTooltip({ toolbarNotifications, store: rootStore })
    initRibbonAndSidebar({
        annotationsManager,
        toolbarNotifications,
        store: rootStore,
    })
    initSocialIntegration({ annotationsManager })
    initKeyboardShortcuts({ store: rootStore })
    initHighlights(rootStore)

    async function initStore(store) {
        store.dispatch(initBasicStore() as any)
    }

    async function initHighlights(store) {
        await store.dispatch(
            sidebarActs.setAnnotationsManager(annotationsManager),
        )
        rootStore.dispatch(fetchAnnotationsForPageUrl(false, true) as any)
    }
}

main()
