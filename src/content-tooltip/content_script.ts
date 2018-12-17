import { bodyLoader } from '../util/loader'
import * as interactions from './interactions'
import ToolbarNotifications from '../toolbar-notification/content_script'
import { getTooltipState } from './utils'

export default async function init({
    toolbarNotifications,
}: {
    toolbarNotifications?: ToolbarNotifications
}) {
    // Set up the RPC calls even if the tooltip is enabled or not.
    interactions.setupRPC({ toolbarNotifications })
    await interactions.conditionallyShowOnboardingNotifications({
        toolbarNotifications,
    })
    const isTooltipEnabled = await getTooltipState()
    if (!isTooltipEnabled) {
        return
    }

    await bodyLoader()
    await interactions.insertTooltip({ toolbarNotifications })
}
