import { remoteFunction } from 'src/util/webextensionRPC'
import { getPageCenter, isDemoPage } from './utils'

import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { STORAGE_KEYS } from 'src/overview/onboarding/constants'
import { EVENT_NAMES } from 'src/analytics/internal/constants'

const processEventRPC = remoteFunction('processEvent')

/**
 * Conditionally trigger after highlight message during onboarding.
 * @param toolbarNotifications Toolbar Notification object instance
 * @param position Position of the tooltip
 */
export const conditionallyShowHighlightNotification = async ({
    toolbarNotifications,
    position,
}) => {
    if (!isDemoPage()) {
        return
    }

    const annotationStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step1,
    )

    if (annotationStage !== 'highlight_text_notification_shown') {
        return
    }

    // Remove previous notification
    toolbarNotifications._destroyRootElement()
    toolbarNotifications.showToolbarNotification('onboarding-select-option', {
        position,
    })
    processEventRPC({
        type: EVENT_NAMES.ONBOARDING_HIGHLIGHT_MADE,
    })
    await setLocalStorage(
        STORAGE_KEYS.onboardingDemo.step1,
        'select_option_notification_shown',
    )
}

/**
 * Trigger's the next notification which is seen after the user clicks
 * "browse around a bit" in Power Search welcome notification.
 */

const handler = toolbarNotifications => async () => {
    toolbarNotifications._destroyRootElement()
    toolbarNotifications.showToolbarNotification('go-to-dashboard')

    processEventRPC({
        type: EVENT_NAMES.POWERSEARCH_BROWSE_PAGE,
    })

    await setLocalStorage(
        STORAGE_KEYS.onboardingDemo.step2,
        'overview-tooltips',
    )
}

/**
 * Shows Toolbar notifications on website based on
 * onboarding flags set in local storage.
 * @param toolbarNotifications ToolbarNotification instance to trigger notification
 */
export const conditionallyShowOnboardingNotifications = async ({
    toolbarNotifications,
}) => {
    if (!isDemoPage()) {
        return
    }

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
        const position = getPageCenter()
        toolbarNotifications._destroyRootElement()
        toolbarNotifications.showToolbarNotification('power-search-browse', {
            position,
            triggerNextNotification: handler(toolbarNotifications),
        })
        await setLocalStorage(
            STORAGE_KEYS.onboardingDemo.step2,
            'power-search-browse-shown',
        )
    }
}
