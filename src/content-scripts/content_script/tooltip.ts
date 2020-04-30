import { ContentScriptRegistry, TooltipScriptMain } from './types'

import { InPageUIInterface } from 'src/in-page-ui/shared-state/types'
import { bodyLoader } from 'src/util/loader'
import ToolbarNotifications from 'src/toolbar-notification/content_script'
import {
    runOnScriptShutdown,
    getTooltipState,
} from 'src/in-page-ui/tooltip/utils'
import {
    removeTooltip,
    setupRPC,
    insertTooltip,
} from 'src/in-page-ui/tooltip/content_script/interactions'
import { conditionallyShowOnboardingNotifications } from 'src/in-page-ui/tooltip/onboarding-interactions'

export const main: TooltipScriptMain = async options => {
    runOnScriptShutdown(() => removeTooltip())
    // Set up the RPC calls even if the tooltip is enabled or not.
    setupRPC(options)
    await conditionallyShowOnboardingNotifications({
        toolbarNotifications: options.toolbarNotifications,
    })

    const isTooltipEnabled = await getTooltipState()
    if (!isTooltipEnabled) {
        return
    }

    await bodyLoader()
    await insertTooltip(options)
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerTooltipScript(main)
