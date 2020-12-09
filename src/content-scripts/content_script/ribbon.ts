import { browser } from 'webextension-polyfill-ts'

import { IGNORE_CLICK_OUTSIDE_CLASS } from '../constants'
import { ContentScriptRegistry, RibbonScriptMain } from './types'
import { setupRibbonUI, destroyRibbonUI } from 'src/in-page-ui/ribbon/react'
import { createInPageUI, destroyInPageUI } from 'src/in-page-ui/utils'
import { setSidebarState, getSidebarState } from 'src/sidebar-overlay/utils'
import { runInBackground } from 'src/util/webextensionRPC'
import { ContentScriptsInterface } from '../background/types'

export const main: RibbonScriptMain = async (options) => {
    console.log('inside ribbon setup')
    const cssFile = browser.extension.getURL(`/content_script_ribbon.css`)
    let mount: ReturnType<typeof createInPageUI> | null = null
    const createMount = () => {
        if (!mount) {
            mount = createInPageUI('ribbon', cssFile, [
                IGNORE_CLICK_OUTSIDE_CLASS,
            ])
        }
    }
    console.log('creat mount')
    createMount()
    console.log('after creat mount')

    options.inPageUI.events.on('componentShouldSetUp', ({ component }) => {
        console.log('componentShouldSetup:', component)
        if (component === 'ribbon') {
            setUp()
        }
    })
    options.inPageUI.events.on('componentShouldDestroy', ({ component }) => {
        console.log('componentShouldDestroy:', component)
        if (component === 'ribbon') {
            destroy()
        }
    })

    const setUp = async () => {
        console.log('calling ribbon setup')
        const currentTab = await runInBackground<
            ContentScriptsInterface<'caller'>
        >().getCurrentTab()

        createMount()
        console.log('mount created')
        setupRibbonUI(mount.rootElement, {
            containerDependencies: {
                ...options,
                currentTab,
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

        destroyInPageUI('ribbon')
        destroyRibbonUI(mount.rootElement, mount.shadowRoot)
    }
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerRibbonScript(main)
