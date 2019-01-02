import { createAction } from 'redux-act'

import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { STORAGE_KEYS } from './constants'

export const setAnnotationStage = createAction<string>(
    'onboarding/setAnnotationStage',
)
export const setPowerSearchStage = createAction<string>(
    'onboarding/setPowerSearchStage',
)
export const setTaggingStage = createAction<string>(
    'onboarding/setTaggingStage',
)
export const setShowOnboardingBox = createAction<boolean>(
    'onboarding/setShowOnboardingBox',
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
    const taggingStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step3,
        'unvisited',
    )
    dispatch(setAnnotationStage(annotationStage))
    dispatch(setPowerSearchStage(powerSearchStage))
}

export const fetchShowOnboarding = () => async dispatch => {
    const showOnboardingBox = await getLocalStorage(
        STORAGE_KEYS.shouldShowOnboarding,
        true,
    )
    dispatch(setShowOnboardingBox(showOnboardingBox))
}

/**
 * Sets Power Search Stage as done.
 * Dispatched from the last tooltip in Power Search Stage.
 */
export const setPowerSearchDone = () => async dispatch => {
    await setLocalStorage(STORAGE_KEYS.onboardingDemo.step2, 'DONE')
    dispatch(setPowerSearchStage('DONE'))
}

export const closeOnboardingBox = () => async dispatch => {
    await setLocalStorage(STORAGE_KEYS.shouldShowOnboarding, false)
    dispatch(setShowOnboardingBox(false))
}
