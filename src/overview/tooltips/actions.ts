import { createAction } from 'redux-act'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

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
        // Set state to done, as the onboarding tooltips must be shown only once
        await setLocalStorage(onboardingKeys.onboardingDemo.step2, 'DONE')
    }
}

export const fetchWhichTooltip = () => async dispatch => {
    const whichTooltip = await getLocalStorage(tooltipKey, 'none')
    dispatch(setWhichTooltip(whichTooltip))
}
