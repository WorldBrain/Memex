import { browser } from 'webextension-polyfill-ts'

import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { STORAGE_KEYS } from './constants'

const taggingStageKey: string = STORAGE_KEYS.onboardingDemo.step3

/**
 * Fetches the tagging stage status from local storage and checks
 * whether the in page notification for tagging is shown.
 */
const _checkTaggingStageStatus = async () => {
    const taggingStage = await getLocalStorage(taggingStageKey, 'unvisited')
    if (taggingStage === 'tag-page-notification-shown') {
        return true
    }
    return false
}

const _setStageDone = async () => {
    await setLocalStorage(taggingStageKey, 'DONE')
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

    await _setStageDone()
    setTimeout(async () => {
        await _goToDashboard()
    }, 1000)
}
