import { browser } from 'webextension-polyfill-ts'

import { IGNORE_CLICK_OUTSIDE_CLASS } from '../constants'
import { ContentScriptRegistry, SidebarScriptMain } from './types'
import { createInPageUI } from 'src/in-page-ui/utils'
import { setupSidebarUI, destroySidebarUI } from 'src/in-page-ui/sidebar/react'

export const main: SidebarScriptMain = async (dependencies) => {
    const cssFile = browser.extension.getURL(`/content_script_sidebar.css`)

    dependencies.inPageUI.events.on('componentShouldSetUp', ({ component }) => {
        if (component === 'sidebar') {
            setUp()
        }
    })
    dependencies.inPageUI.events.on(
        'componentShouldDestroy',
        ({ component }) => {
            if (component === 'sidebar') {
                destroy()
            }
        },
    )

    let mount: ReturnType<typeof createInPageUI> | null = null
    const setUp = () => {
        mount = createInPageUI('sidebar', cssFile, [IGNORE_CLICK_OUTSIDE_CLASS])
        setupSidebarUI(mount.rootElement, dependencies, {
            env: 'inpage',
        })
    }

    const destroy = () => {
        if (!mount) {
            return
        }

        destroySidebarUI(mount.rootElement, mount.shadowRoot)
    }
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerSidebarScript(main)
