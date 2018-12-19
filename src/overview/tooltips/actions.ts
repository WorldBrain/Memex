import { createAction } from 'redux-act'
import { getLocalStorage } from 'src/util/storage'

import { STORAGE_KEY as tooltipKey } from './constants'
import { STORAGE_KEYS as onboardingKeys } from '../onboarding/constants'

export const setWhichTooltip = createAction<string>('tooltips/setTooltip')
export const setShowTooltip = createAction<boolean>('tooltips/setShowTooltip')

export const fetchOnboardingState = () => async dispatch => {
    const onboardingState = await getLocalStorage(
        onboardingKeys.onboardingDemo.step2,
    )
    if (onboardingState === 'overview-tooltips') {
        dispatch(setShowTooltip(true))
    }
}

export const fetchWhichTooltip = () => async dispatch => {
    const whichTooltip = await getLocalStorage(tooltipKey, 'none')
    dispatch(setWhichTooltip(whichTooltip))
}
