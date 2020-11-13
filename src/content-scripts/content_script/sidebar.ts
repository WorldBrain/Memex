import { browser } from 'webextension-polyfill-ts'

import { IGNORE_CLICK_OUTSIDE_CLASS } from '../constants'
import { ContentScriptRegistry, SidebarScriptMain } from './types'
import { createInPageUI, destroyInPageUI } from 'src/in-page-ui/utils'
import {
    setupInPageSidebarUI,
    destroyInPageSidebarUI,
} from 'src/sidebar/annotations-sidebar/index'
import { runInBackground } from 'src/util/webextensionRPC'
import { ContentScriptsInterface } from '../background/types'
import { InPageUIRootMount } from 'src/in-page-ui/types'

export const main: SidebarScriptMain = async (dependencies) => {
    const cssFile = browser.extension.getURL(`/content_script_sidebar.css`)
    let mount: InPageUIRootMount | null = null
    const createMount = () => {
        if (!mount) {
            mount = createInPageUI('sidebar', cssFile, [
                IGNORE_CLICK_OUTSIDE_CLASS,
            ])
        }
    }
    createMount()

    dependencies.inPageUI.events.on(
        'componentShouldSetUp',
        ({ component, options }) => {
            if (component === 'sidebar') {
                setUp({ showOnLoad: options.showSidebarOnLoad })
            }
        },
    )
    dependencies.inPageUI.events.on(
        'componentShouldDestroy',
        ({ component }) => {
            if (component === 'sidebar') {
                destroy()
            }
        },
    )

    const setUp = async (options: { showOnLoad?: boolean } = {}) => {
        // const currentTab = await runInBackground<
        //     ContentScriptsInterface<'caller'>
        // >().getCurrentTab()

        createMount()
        setupInPageSidebarUI(mount, {
            ...dependencies,
            // pageUrl: currentTab.url,
            pageUrl: dependencies.getPageUrl(),
            initialState: options.showOnLoad ? 'visible' : 'hidden',
        })
    }

    const destroy = () => {
        if (!mount) {
            return
        }

        destroyInPageUI('sidebar')
        destroyInPageSidebarUI(mount.rootElement, mount.shadowRoot)
    }
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerSidebarScript(main)
