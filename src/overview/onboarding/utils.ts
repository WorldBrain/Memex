import { STORAGE_KEYS, ANNOTATION_DEMO_URL, STAGES, FLOWS } from './constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { browser } from 'webextension-polyfill-ts'

/**
 * Returns the stage of the onboarding if present, else sets it to unvisited and
 * returns it.
 * @param flow Onboarding flow to return the stage for
 */
export const fetchOnboardingStage = async (flow: string): Promise<string> => {
    const stage = await getLocalStorage(
        STORAGE_KEYS.onboardingFlows[flow],
        STAGES.unvisited,
    )
    return stage
}

/**
 * Helper to set the stage of an onboarding flow in storage.
 * @param flow Annotation stage to set value for
 * @param value Value to be set
 */
export const setOnboardingStage = (flow: string, value: string) =>
    setLocalStorage(STORAGE_KEYS.onboardingFlows[flow], value)

/**
 * Helper function to fetch and return stages of all
 * onboarding flows.
 */

export const fetchAllStages = async () => {
    const keys = STORAGE_KEYS.onboardingFlows
    const stages = await browser.storage.local.get(Object.values(keys))

    return {
        annotationStage: stages[keys.annotation],
        powerSearchStage: stages[keys.powerSearch],
        taggingStage: stages[keys.tagging],
        backupStage: stages[keys.backup],
    }
}

/**
 * Conditionally sets the power search stage as 'skip-to-time-filters'.
 * Used when user searches through the Memex omnibar.
 */
export const conditionallySkipToTimeFilter = async () => {
    const powerSearchStage = await fetchOnboardingStage(FLOWS.powerSearch)
}

/**
 * Check if the URL has the parameter install set to true
 */
export const isDuringInstall = (loc = window.location): boolean =>
    loc.href.indexOf('install=true') > -1

/**
 * Find the page center of the current page.
 * Used to display the browse notification.
 * TODO: Move to using CSS to do this
 */
export const getPageCenter = (): { x: number; y: number } => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2 - 200, // Assuming average height as 200, since height is 'auto'
})

/**
 * Check whether page is onboarding demo page (Wikipedia Memex)
 */
export const isDemoPage = (): boolean =>
    window.location.href === ANNOTATION_DEMO_URL

/**
 * Opens the demo page in a new tab
 */
export const openDemoPage = () =>
    browser.tabs.create({
        url: ANNOTATION_DEMO_URL,
        active: true,
    })
