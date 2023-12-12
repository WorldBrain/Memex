import { remoteFunction } from 'src/util/webextensionRPC'
import { FLOWS, STAGES } from './constants'
import { fetchOnboardingStage, setOnboardingStage } from './utils'

const openOptionsRPC = remoteFunction('openOptionsTab')

/**
 * Fetches the tagging stage status from local storage and checks
 * whether the in page notification for tagging is shown.
 */
const _checkTaggingStageStatus = async () => {
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

    setTimeout(async () => {
        openOptionsRPC('overview')
    }, 1000)
}
