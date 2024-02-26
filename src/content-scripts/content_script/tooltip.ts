import type { ContentScriptRegistry, TooltipScriptMain } from './types'
import { bodyLoader } from 'src/util/loader'
import { runOnScriptShutdown } from 'src/in-page-ui/tooltip/utils'
import {
    removeTooltip,
    insertTooltip,
    showContentTooltip,
} from 'src/in-page-ui/tooltip/content_script/interactions'
import { conditionallyShowOnboardingNotifications } from 'src/in-page-ui/tooltip/onboarding-interactions'
import { insertTutorial } from 'src/in-page-ui/tooltip/content_script/tutorialInteractions'
import { browser } from 'webextension-polyfill-ts'
import type { InPageUIRootMount } from 'src/in-page-ui/types'
import { createInPageUI, destroyInPageUI } from 'src/in-page-ui/utils'
import { IGNORE_CLICK_OUTSIDE_CLASS } from '../constants'

export const main: TooltipScriptMain = async (options) => {
    const cssFile = browser.runtime.getURL(`/content_script_tooltip.css`)
    let mount: InPageUIRootMount | null = null
    const createMount = () => {
        if (!mount) {
            mount = createInPageUI('tooltip', cssFile, [
                IGNORE_CLICK_OUTSIDE_CLASS,
            ])
        }
    }
    createMount()

    runOnScriptShutdown(() => removeTooltip())
    // await conditionallyShowOnboardingNotifications({
    //     toolbarNotifications: options.toolbarNotifications,
    // })

    options.inPageUI.events.on('componentShouldSetUp', async (event) => {
        if (event.component === 'tooltip') {
            createMount()
            await bodyLoader()
            await insertTooltip({ ...options, mount })
            // await insertTutorial()
        }
    })
    options.inPageUI.events.on('componentShouldDestroy', async (event) => {
        if (event.component === 'tooltip') {
            destroyInPageUI('tooltip')
            removeTooltip()
        }
    })
    options.inPageUI.events.on('stateChanged', async (event) => {
        if (!('tooltip' in event.changes)) {
            return
        }
        if (event.newState.tooltip) {
            showContentTooltip({ ...options, mount })
        }
    })
}

const registry = globalThis['contentScriptRegistry'] as ContentScriptRegistry
registry.registerTooltipScript(main)
