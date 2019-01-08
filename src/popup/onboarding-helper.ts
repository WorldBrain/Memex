import { browser } from 'webextension-polyfill-ts'

import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { STORAGE_KEYS } from 'src/overview/onboarding/constants'

const taggingStageKey: string = STORAGE_KEYS.onboardingDemo.step3

const checkTaggingStageStatus = async () => {
    const taggingStage = await getLocalStorage(taggingStageKey, 'unvisited')
    if (taggingStage === 'tag-page-notification-shown') {
        return true
    }
    return false
}

const setStageDone = async () => {
    await setLocalStorage(taggingStageKey, 'DONE')
}

const goToDashboard = async () => {
    browser.tabs.create({
        url: browser.runtime.getURL('options.html#/overview'),
    })
}

const helper = async () => {
    const shouldProceed = await checkTaggingStageStatus()

    if (!shouldProceed) {
        return
    }

    await setStageDone()
    setTimeout(async () => {
        await goToDashboard()
    }, 1000)
}

export default helper
