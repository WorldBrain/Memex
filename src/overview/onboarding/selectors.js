import { createSelector } from 'reselect'

export const onboarding = state => state.onboarding

export const onboardingStages = createSelector(
    onboarding,
    state => state.onboardingStages,
)
