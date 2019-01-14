import { STORAGE_KEYS, ANNOTATION_DEMO_URL } from './constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

export const conditionallySkipToTimeFilter = async () => {
    const powerSearchStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step2,
        'unvisited',
    )

    if (
        powerSearchStage === 'power-search-browse-shown' ||
        powerSearchStage === 'overview-tooltips'
    ) {
        await setLocalStorage(
            STORAGE_KEYS.onboardingDemo.step2,
            'skip-to-time-filters',
        )
    }
}

/**
 * Check if the URL has the parameter install set to true
 */
export const isDuringInstall = (): boolean =>
    location.href.indexOf('install=true') > -1

// Finding the coordinates to center the notification box
export const getPageCenter = () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2 - 200, // Assuming average height as 200, since height is 'auto'
})

/**
 * Check whether page is onboarding demo page (Wikipedia Memex)
 */
export const isDemoPage = () => window.location.href === ANNOTATION_DEMO_URL
