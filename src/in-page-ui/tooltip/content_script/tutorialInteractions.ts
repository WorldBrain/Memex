import {
    setupTutorialUIContainer,
    destroyUIContainer,
} from 'src/in-page-ui/guided-tutorial/content-script/components'
import { getUnderlyingResourceUrl } from 'src/util/uri-utils'
import { GUIDED_ONBOARDING_URL } from 'src/overview/onboarding/constants'

// Target container for the Tutorial.
let tutorialTarget = null
let showTutorial = null

/**
 * Creates target container for Tutorial.
 * Mounts Tutorial React component.
 * Sets up Container <---> webpage Remote functions.
 */
export const insertTutorial = async () => {
    // temporary hack to inject guided tutorial
    if (
        !tutorialTarget &&
        getUnderlyingResourceUrl(window.location.href).includes(
            GUIDED_ONBOARDING_URL,
        )
    ) {
        tutorialTarget = document.createElement('div')
        tutorialTarget.setAttribute('id', 'memex-guided-tutorial')
        document.body.appendChild(tutorialTarget)

        showTutorial = await setupTutorialUIContainer(tutorialTarget, {
            destroyTutorial: async () => {
                // analytics.trackEvent({
                //     category: 'InPageTooltip',
                //     action: 'closeTooltip',
                // })
                // manualOverride = true
                removeTutorial()

                // const closeMessageShown = await _getCloseMessageShown()
                // if (!closeMessageShown) {
                //     params.toolbarNotifications.showToolbarNotification(
                //         'tooltip-first-close',
                //         {},
                //     )
                //     _setCloseMessageShown()
                // }
            },
            finishTutorial: async () => {
                // analytics.trackEvent({
                //     category: 'InPageTooltip',
                //     action: 'closeTooltip',
                // })
                // manualOverride = true
                removeTutorial()

                // const closeMessageShown = await _getCloseMessageShown()
                // if (!closeMessageShown) {
                //     params.toolbarNotifications.showToolbarNotification(
                //         'tooltip-first-close',
                //         {},
                //     )
                //     _setCloseMessageShown()
                // }
            },
        })
    }
}

export const removeTutorial = (options?: { override?: boolean }) => {
    if (!tutorialTarget) {
        return
    }
    destroyUIContainer(tutorialTarget)
    tutorialTarget.remove()

    tutorialTarget = null
}
