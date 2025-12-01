import { IGNORE_CLICK_OUTSIDE_CLASS } from '../constants'
import type { ContentScriptRegistry, SidebarScriptMain } from './types'
import {
    createInPageUI,
    unmountInPageUI,
    destroyInPageUI,
} from 'src/in-page-ui/utils'
import { setupInPageSidebarUI } from 'src/sidebar/annotations-sidebar/index'

import type { InPageUIRootMount } from 'src/in-page-ui/types'
import type { ShouldSetUpOptions } from 'src/in-page-ui/shared-state/types'

export const main: SidebarScriptMain = async (dependencies) => {
    const cssFile = null
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
                setUp(options)
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

    const setUp = async (options: ShouldSetUpOptions = {}) => {
        createMount()
        setupInPageSidebarUI(mount, {
            ...dependencies,
            getRootElement: () => mount.rootElement,
            fullPageUrl: await dependencies.getFullPageUrl(),
            initialState: options.showSidebarOnLoad ? 'visible' : 'hidden',
        })
    }

    const destroy = () => {
        if (!mount) {
            return
        }
        destroyInPageUI('sidebar')
        unmountInPageUI(mount.rootElement, mount.shadowRoot)
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
        registry.registerSidebarScript(main)
    })
    .catch((error) => {
        console.error('Failed to register sidebar script:', error)
    })
