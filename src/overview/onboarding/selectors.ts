import { createSelector } from 'reselect'
import { RootState } from '../../options/types'

export const onboarding = (state: RootState) => state.onboarding

export const annotationStage = createSelector(
    onboarding,
    state => state.annotationStage,
)
export const powerSearchStage = createSelector(
    onboarding,
    state => state.powerSearchStage,
)
export const taggingStage = createSelector(
    onboarding,
    state => state.taggingStage,
)
export const backupStage = createSelector(
    onboarding,
    state => state.backupStage,
)
export const showOnboardingBox = createSelector(
    onboarding,
    state => state.showOnboardingBox,
)
export const congratsMessage = createSelector(
    onboarding,
    state => state.congratsMessage,
)

export const isAnnotationDone = createSelector(
    annotationStage,
    stage => stage === 'DONE',
)

export const isPowerSearchDone = createSelector(
    powerSearchStage,
    stage => stage === 'DONE',
)

export const isTaggingDone = createSelector(
    taggingStage,
    stage => stage === 'DONE',
)

export const isBackupDone = createSelector(
    backupStage,
    stage => stage === 'DONE',
)
