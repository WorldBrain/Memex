import { createAction } from 'redux-act'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

import * as selectors from './selectors'
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
export const setCongratsMessage = createAction<boolean>(
    'onboarding/setCongratsMessage',
)
export const setBackupStage = createAction<string>('onboarding/setBackupStage')

export const checkForCompletion = () => (dispatch, getState) => {
    const state = getState()
    const annotationStage = selectors.annotationStage(state)
    const powerSearchStage = selectors.powerSearchStage(state)
    const taggingStage = selectors.taggingStage(state)
    const backupStage = selectors.backupStage(state)

    if (
        annotationStage === 'DONE' &&
        powerSearchStage === 'DONE' &&
        taggingStage === 'DONE' &&
        backupStage === 'DONE'
    ) {
        dispatch(setCongratsMessage(true))
    }
}

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
    const backupStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step4,
        'unvisited',
    )

    dispatch(setAnnotationStage(annotationStage))
    dispatch(setPowerSearchStage(powerSearchStage))
    dispatch(setTaggingStage(taggingStage))
    dispatch(setBackupStage(backupStage))

    dispatch(checkForCompletion())
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
    dispatch(checkForCompletion())
}

export const setBackupStageDone = () => async dispatch => {
    await setLocalStorage(STORAGE_KEYS.onboardingDemo.step4, 'DONE')
    dispatch(setBackupStage('DONE'))
    dispatch(checkForCompletion())
}

export const closeOnboardingBox = () => async dispatch => {
    await setLocalStorage(STORAGE_KEYS.shouldShowOnboarding, false)
    dispatch(setShowOnboardingBox(false))
}
