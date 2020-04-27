import { browser } from 'webextension-polyfill-ts'
import { ContentScriptRegistry, RibbonScriptMain } from './types'
import { setupRibbonUI, destroyRibbonUI } from 'src/in-page-ui/ribbon/react'
import { createInPageUI } from 'src/in-page-ui/utils'
import { setSidebarState, getSidebarState } from 'src/sidebar-overlay/utils'

export const main: RibbonScriptMain = async options => {
    const cssFile = browser.extension.getURL(`/content_script_ribbon.css`)

    options.inPageUI.events.on('componentShouldSetUp', ({ component }) => {
        if (component === 'ribbon') {
            setUp()
        }
    })
    options.inPageUI.events.on('componentShouldDestroy', ({ component }) => {
        if (component === 'ribbon') {
            destroy()
        }
    })

    let mount: ReturnType<typeof createInPageUI> | null = null
    const setUp = () => {
        mount = createInPageUI('ribbon', cssFile)
        setupRibbonUI(mount.rootElement, {
            containerDependencies: {
                ...options,
                setSidebarEnabled: setSidebarState,
                getSidebarEnabled: getSidebarState,
            },
            inPageUI: options.inPageUI,
        })
    }

    const destroy = () => {
        if (!mount) {
            return
        }

        destroyRibbonUI(mount.rootElement, mount.shadowRoot)
    }
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerRibbonScript(main)
