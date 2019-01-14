import { browser } from 'webextension-polyfill-ts'

import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { STAGES } from './constants'
import { fetchOnboardingStage, setOnboardingStage } from './utils'
import { utils } from 'src/background-script'

/**
 * Fetches the tagging stage status from local storage and checks
 * whether the in page notification for tagging is shown.
 */
const _checkTaggingStageStatus = async () => {
    const taggingStage = await fetchOnboardingStage('tagging')
    if (taggingStage === STAGES.tagging.notifiedTagPage) {
        return true
    }
    return false
}

/**
 * Creates a new tab to the overview dashboard.
 */
const _goToDashboard = async () => {
    browser.tabs.create({
        url: browser.runtime.getURL('options.html#/overview'),
    })
}

/**
 * Checks the Onboarding tagging stage, if the right flag is present
 * sets the stage to done. Executes after the first tag or collection
 * is added to a page.
 */
export const checkForTaggingStage = async () => {
    const shouldProceed = await _checkTaggingStageStatus()

    if (!shouldProceed) {
        return
    }

    await setOnboardingStage('tagging', STAGES.done)
    setTimeout(async () => {
        await _goToDashboard()
    }, 1000)
}
