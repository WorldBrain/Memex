import browser from 'webextension-polyfill'

import { IGNORE_CLICK_OUTSIDE_CLASS } from '../constants'
import type { ContentScriptRegistry, RibbonScriptMain } from './types'
import { setupRibbonUI, destroyRibbonUI } from 'src/in-page-ui/ribbon/react'
import { createInPageUI, destroyInPageUI } from 'src/in-page-ui/utils'
import { setSidebarState, getSidebarState } from 'src/sidebar-overlay/utils'
import type { ShouldSetUpOptions } from 'src/in-page-ui/shared-state/types'

export const main: RibbonScriptMain = async (options) => {
    const cssFile = browser.runtime.getURL(`/content_script_ribbon.css`)
    let mount: ReturnType<typeof createInPageUI> | null = null
    const createMount = () => {
        if (!mount) {
            mount = createInPageUI('ribbon', cssFile, [
                IGNORE_CLICK_OUTSIDE_CLASS,
            ])
        }
    }
    createMount()

    options.inPageUI.events.on(
        'componentShouldSetUp',
        ({ component, options }) => {
            if (component === 'ribbon') {
                setUp(options)
            }
        },
    )
    options.inPageUI.events.on('componentShouldDestroy', ({ component }) => {
        if (component === 'ribbon') {
            destroy()
        }
    })

    const setUp = async (setUpOptions: ShouldSetUpOptions = {}) => {
        createMount()
        setupRibbonUI(mount, {
            containerDependencies: {
                ...options,
                currentTab: (await browser.tabs?.getCurrent()) ?? {
                    id: undefined,
                    url: await options.getFullPageUrl(),
                },
                getRootElement: () => mount.rootElement,
                setSidebarEnabled: setSidebarState,
                getSidebarEnabled: getSidebarState,
            },
            inPageUI: options.inPageUI,
            setUpOptions,
            analyticsBG: options.analyticsBG,
            events: options.events,
            browserAPIs: options.browserAPIs,
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

const registry = globalThis['contentScriptRegistry'] as ContentScriptRegistry
registry.registerRibbonScript(main)
