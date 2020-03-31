import { RemoteFunctionRegistry } from 'src/util/webextensionRPC'
import AnnotationsManager from 'src/annotations/annotations-manager'
import setupContentTooltip from 'src/content-tooltip/content_script'
import initRibbonAndSidebar from 'src/sidebar-overlay/content_script'
import ToolbarNotifications from 'src/toolbar-notification/content_script'
import initSocialIntegration from 'src/social-integration/content_script'
import configureStore from 'src/sidebar-overlay/store'
import { initKeyboardShortcuts } from 'src/content_script_keyboard_shortcuts'
import { fetchAnnotationsForPageUrl } from 'src/annotations/actions'
import * as sidebarActs from 'src/sidebar-overlay/sidebar/actions'
import { initBasicStore } from 'src/popup/actions'
import { ContentScriptRegistry } from './types'

export async function main() {
    const remoteFunctionRegistry = new RemoteFunctionRegistry()
    const toolbarNotifications = new ToolbarNotifications()
    const annotationsManager = new AnnotationsManager()

    const rootStore = configureStore()

    toolbarNotifications.registerRemoteFunctions(remoteFunctionRegistry)
    window['toolbarNotifications'] = toolbarNotifications

    rootStore.dispatch(initBasicStore() as any)
    setupContentTooltip({ toolbarNotifications, store: rootStore })
    initRibbonAndSidebar({
        annotationsManager,
        toolbarNotifications,
        store: rootStore,
    })
    initSocialIntegration({ annotationsManager })
    initKeyboardShortcuts({ store: rootStore })
    initHighlights(rootStore)

    async function initHighlights(store) {
        await store.dispatch(
            sidebarActs.setAnnotationsManager(annotationsManager),
        )
        rootStore.dispatch(fetchAnnotationsForPageUrl(false, true) as any)
    }
}

// const registry = window['contentScriptRegistry'] as ContentScriptRegistry
// registry.registerInPageUIScript(main)
