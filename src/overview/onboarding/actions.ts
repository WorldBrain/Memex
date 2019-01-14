import { createAction } from 'redux-act'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

import * as selectors from './selectors'
import * as utils from './utils'
import { STORAGE_KEYS, STAGES } from './constants'

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

/**
 * Checks whether all stages of onboarding is DONE.
 * If yes, set congratsMessage to True.
 */
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

/**
 * Hydrates the onboarding states from the storage.
 */
export const fetchOnboardingStages = () => async dispatch => {
    // Fetch keys from storage
    const {
        annotationStage,
        powerSearchStage,
        taggingStage,
        backupStage,
    } = await utils.fetchAllStages()

    dispatch(setAnnotationStage(annotationStage))
    dispatch(setPowerSearchStage(powerSearchStage))
    dispatch(setTaggingStage(taggingStage))
    dispatch(setBackupStage(backupStage))

    dispatch(checkForCompletion())
}

/**
 * Hydrates the showOnboardingBox from storage
 */
export const fetchShowOnboarding = () => async dispatch => {
    const showOnboardingBox = await getLocalStorage(
        STORAGE_KEYS.shouldShowOnboarding,
        true,
    )
    dispatch(setShowOnboardingBox(showOnboardingBox))
}

export const setPowerSearchDone = () => async dispatch => {
    await utils.setOnboardingStage('powerSearch', STAGES.done)
    dispatch(setPowerSearchStage('DONE'))
    dispatch(checkForCompletion())
}

export const setBackupStageDone = () => async dispatch => {
    await utils.setOnboardingStage('backup', STAGES.done)
    dispatch(setBackupStage('DONE'))
    dispatch(checkForCompletion())
}

export const closeOnboardingBox = () => async dispatch => {
    await setLocalStorage(STORAGE_KEYS.shouldShowOnboarding, false)
    dispatch(setShowOnboardingBox(false))
}
