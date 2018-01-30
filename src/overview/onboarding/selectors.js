import { createSelector } from 'reselect'

export const onboarding = state => state.onboarding
export const isVisible = createSelector(onboarding, state => state.isVisible)
