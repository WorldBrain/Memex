import { createAction } from 'redux-act'

import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { STORAGE_KEYS } from './constants'
import * as selectors from './selectors'

export const setOnboardingStages = createAction(
    'onboarding/setOnboardingStages',
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
    dispatch(
        setOnboardingStages({
            annotationStage,
            powerSearchStage,
        }),
    )
}

/**
 * Sets Power Search Stage as done.
 * Dispatched from the last tooltip in Power Search Stage.
 */
export const setPowerSearchDone = () => async (dispatch, getState) => {
    const state = getState()
    const onboardingStages = selectors.onboardingStages(state)
    await setLocalStorage(STORAGE_KEYS.onboardingDemo.step2, 'DONE')
    dispatch(
        setOnboardingStages({
            ...onboardingStages,
            powerSearchStage: 'DONE',
        }),
    )
}
