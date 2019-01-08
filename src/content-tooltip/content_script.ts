import { bodyLoader } from '../util/loader'
import { setupRPC, insertTooltip } from './interactions'
import ToolbarNotifications from '../toolbar-notification/content_script'
import { conditionallyShowOnboardingNotifications } from './onboarding-notifications'
import { getTooltipState } from './utils'

export default async function init({
    toolbarNotifications,
}: {
    toolbarNotifications?: ToolbarNotifications
}) {
    // Set up the RPC calls even if the tooltip is enabled or not.
    setupRPC({ toolbarNotifications })
    await conditionallyShowOnboardingNotifications({
        toolbarNotifications,
    })
    const isTooltipEnabled = await getTooltipState()
    if (!isTooltipEnabled) {
        return
    }

    await bodyLoader()
    await insertTooltip({ toolbarNotifications })
}
