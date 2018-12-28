import { createAction } from 'redux-act'

import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { STORAGE_KEYS } from './constants'

export const setAnnotationStage = createAction<string>(
    'onboarding/setAnnotationStage',
)
export const setPowerSearchStage = createAction<string>(
    'onboarding/setPowerSearchStage',
)

export const fetchOnboardingStages = () => async dispatch => {
    const annotationStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step1,
        'unvisited',
    )
    const powerSearchStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step2,
        'unvisited',
    )
    dispatch(setAnnotationStage(annotationStage))
    dispatch(setPowerSearchStage(powerSearchStage))
}

/**
 * Sets Power Search Stage as done.
 * Dispatched from the last tooltip in Power Search Stage.
 */
export const setPowerSearchDone = () => async dispatch => {
    await setLocalStorage(STORAGE_KEYS.onboardingDemo.step2, 'DONE')
    dispatch(setPowerSearchStage('DONE'))
}
