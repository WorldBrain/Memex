import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'

import { getLocalStorage } from 'src/util/storage'
import { FLOWS, STAGES, STORAGE_KEYS } from 'src/overview/onboarding/constants'
import * as utils from 'src/overview/onboarding/utils'

import { destroyRootElement } from 'src/toolbar-notification/content_script/rendering'

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
    if (!utils.isDemoPage()) {
        return
    }

    const annotationStage = await utils.fetchOnboardingStage(FLOWS.annotation)

    if (annotationStage !== STAGES.annotation.notifiedHighlightText) {
        return
    }

    // Toolbar Notfication doesn't destroy the previous tooltip by default
    // So hack to destroy it using private method.
    toolbarNotifications._destroyRootElement()

    processEventRPC({
        type: EVENT_NAMES.ONBOARDING_HIGHLIGHT_MADE,
    })
    await utils.setOnboardingStage(
        FLOWS.annotation,
        STAGES.annotation.notifiedSelectOption,
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
}

/**
 * Shows Toolbar notifications on website based on
 * onboarding flags set in local storage.
 * @param toolbarNotifications ToolbarNotification instance to trigger notification
 */
export const conditionallyShowOnboardingNotifications = async ({
    toolbarNotifications,
}) => {
    /*
    Fetch shouldShowOnboarding and return if it's false as
    that would mean the user has closed the onboarding demo.
    */
    const shouldShowOnboarding = await getLocalStorage(
        STORAGE_KEYS.shouldShowOnboarding,
        true,
    )
    if (!utils.isDemoPage() || !shouldShowOnboarding) {
        return
    }

    const {
        annotationStage,
        powerSearchStage,
        taggingStage,
    } = await utils.fetchAllStages()

    if (annotationStage === STAGES.redirected) {
        toolbarNotifications.showToolbarNotification('onboarding-higlight-text')
        await utils.setOnboardingStage(
            FLOWS.annotation,
            STAGES.annotation.notifiedHighlightText,
        )
    }

    if (powerSearchStage === STAGES.redirected) {
        const position = utils.getPageCenter()
        toolbarNotifications._destroyRootElement()
        toolbarNotifications.showToolbarNotification('power-search-browse', {
            position,
            triggerNextNotification: handler(toolbarNotifications),
        })
    }

    if (taggingStage === STAGES.redirected) {
        toolbarNotifications.showToolbarNotification('tag-this-page')
    }
}

/**
 * Conditionally removes the Select Option notification in Annotation
 * Onboarding Flow. Either used when user clicks outside or an annotation
 * is created.
 * @param nextStage Next stage to set for annotations flow
 */
export const conditionallyRemoveOnboardingSelectOption = async nextStage => {
    const annotationStage = await utils.fetchOnboardingStage(FLOWS.annotation)
    if (annotationStage === STAGES.annotation.notifiedSelectOption) {
        await utils.setOnboardingStage(FLOWS.annotation, nextStage)
        // Close the current select-option notification manually since
        // accessing the toolbarNotification instance from here is not possible
        destroyRootElement()
    }
}
