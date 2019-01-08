import { STORAGE_KEYS } from './constants'
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
