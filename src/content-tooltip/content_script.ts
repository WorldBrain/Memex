import { bodyLoader } from '../util/loader'
import * as interactions from './interactions'
import ToolbarNotifications from '../toolbar-notification/content_script'
import { getTooltipState } from './utils'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { STORAGE_KEYS } from 'src/overview/onboarding/constants'

export default async function init({
    toolbarNotifications,
}: {
    toolbarNotifications?: ToolbarNotifications
}) {
    // Set up the RPC calls even if the tooltip is enabled or not.
    interactions.setupRPC({ toolbarNotifications })

    const isTooltipEnabled = await getTooltipState()
    if (!isTooltipEnabled) {
        return
    }

    await bodyLoader()

    const onboardingAnnotationStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step1,
        'unvisited',
    )
    const powerSearchStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step2,
    )

    if (onboardingAnnotationStage === 'highlight_text') {
        toolbarNotifications.showToolbarNotification('onboarding-higlight-text')
        await setLocalStorage(
            STORAGE_KEYS.onboardingDemo.step1,
            'highlight_text_notification_shown',
        )
    }

    if (powerSearchStage === 'redirected') {
        toolbarNotifications._destroyRootElement()
        toolbarNotifications.showToolbarNotification('power-search-browse', {
            x: window.innerHeight / 2,
            y: window.innerHeight / 2,
        })
        await setLocalStorage(
            STORAGE_KEYS.onboardingDemo.step1,
            'power-search-browse-shown',
        )
    }

    await interactions.insertTooltip({ toolbarNotifications })
}
