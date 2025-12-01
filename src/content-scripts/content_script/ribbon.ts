import { IGNORE_CLICK_OUTSIDE_CLASS } from '../constants'
import type { ContentScriptRegistry, RibbonScriptMain } from './types'
import { setupRibbonUI, destroyRibbonUI } from 'src/in-page-ui/ribbon/react'
import { createInPageUI, destroyInPageUI } from 'src/in-page-ui/utils'
import { setSidebarState, getSidebarState } from 'src/sidebar-overlay/utils'
import type { ShouldSetUpOptions } from 'src/in-page-ui/shared-state/types'

export const main: RibbonScriptMain = async (options) => {
    const cssFile = null
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
        const root = (setupRibbonUI(mount, {
            containerDependencies: {
                ...options,
                currentTab: (await chrome.tabs?.getCurrent()) ?? {
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
        })(mount as any).root = root)
    }

    const destroy = () => {
        if (!mount) {
            return
        }

        if ((mount as any).root) {
            ;(mount as any).root.unmount()
        }
        destroyInPageUI('ribbon')
        destroyRibbonUI(mount.rootElement, mount.shadowRoot)
    }
}

// Wait for registry
const waitForRegistry = () => {
    return new Promise((resolve, reject) => {
        if (globalThis['contentScriptRegistry']) {
            resolve(null)
            return
        }
        const startTime = Date.now()
        const interval = setInterval(() => {
            if (globalThis['contentScriptRegistry']) {
                clearInterval(interval)
                resolve(null)
            } else if (Date.now() - startTime > 5000) {
                clearInterval(interval)
                reject(new Error('Timeout waiting for contentScriptRegistry'))
            }
        }, 10)
    })
}

waitForRegistry()
    .then(() => {
        const registry = globalThis[
            'contentScriptRegistry'
        ] as ContentScriptRegistry
        registry.registerRibbonScript(main)
    })
    .catch((error) => {
        console.error('Failed to register ribbon script:', error)
    })
