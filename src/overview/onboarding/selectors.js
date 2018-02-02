import { createSelector } from 'reselect'

import * as constants from './constants'

export const onboarding = state => state.onboarding
export const isVisible = createSelector(onboarding, state => state.isVisible)
export const isImportsDone = createSelector(
    onboarding,
    state => state.isImportsDone,
)
export const progress = createSelector(onboarding, state => state.progress)
export const progressPercent = createSelector(
    progress,
    progress => progress / constants.NUM_IMPORT_ITEMS * 100,
)
export const shouldTrack = createSelector(
    onboarding,
    state => state.shouldTrack,
)
