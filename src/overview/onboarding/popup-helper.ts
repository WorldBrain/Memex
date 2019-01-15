import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import { STAGES } from './constants'
import { fetchOnboardingStage, setOnboardingStage } from './utils'

const processEventRPC = remoteFunction('processEvent')
const openOptionsRPC = remoteFunction('openOptionsTab')

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
        openOptionsRPC('overview')
    }, 1000)

    processEventRPC({ type: EVENT_NAMES.FINISH_TAGGING_ONBOARDING })
}
