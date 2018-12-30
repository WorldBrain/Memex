import { createAction } from 'redux-act'
import { getLocalStorage } from 'src/util/storage'

import * as selectors from './selectors'
import { STORAGE_KEYS as onboardingKeys } from '../onboarding/constants'
import { TOOLTIPS } from './constants'

export const setWhichTooltip = createAction<number>('tooltips/setTooltip')
export const resetWhichTooltip = createAction('tooltip/resetWhichTooltip')
export const setShowTooltip = createAction<boolean>('tooltips/setShowTooltip')

export const fetchOnboardingState = () => async dispatch => {
    const onboardingState = await getLocalStorage(
        onboardingKeys.onboardingDemo.step2,
    )
    if (onboardingState === 'overview-tooltips') {
        dispatch(setShowTooltip(true))
        dispatch(setWhichTooltip(0))
    }
}

export const processAndSetWhichTooltip = (whichTooltip: number) => dispatch => {
    // Do analytics here
    // Fetch tooltip name, generalized to be used with different dispatched actions

    dispatch(setWhichTooltip(whichTooltip))
}

export const setTooltip = (tooltip: string) => dispatch => {
    const index = TOOLTIPS.indexOf(tooltip)
    if (index === -1) {
        return
    }
    dispatch(processAndSetWhichTooltip(index))
}
/**
 * Temporarily removes tooltip by setting tooltip to 'none'
 */
export const closeTooltip = () => dispatch => {
    dispatch(resetWhichTooltip())
}

/**
 * Sets whichTooltip to nextTooltip if next tooltip isn't already shown.
 * Also pushes nextTooltip to prevTooltips array.
 */
export const nextTooltip = () => (dispatch, getState) => {
    const whichTooltip = selectors.whichTooltip(getState())

    // Return if whichTooltip is the last tooltip
    if (whichTooltip >= TOOLTIPS.length - 1) {
        return
    }
    // Else dispatch with incremented index
    dispatch(processAndSetWhichTooltip(whichTooltip + 1))
}

/**
 * Sets tooltip to the previous tooltip shown.
 * Does nothing, if there was no previous tooltip shown
 */
export const previousTooltip = () => (dispatch, getState) => {
    const whichTooltip = selectors.whichTooltip(getState())

    // Return if whichTooltip is at beginning or null
    if (whichTooltip <= 0) {
        return
    }
    // Else decrement tooltip
    dispatch(processAndSetWhichTooltip(whichTooltip - 1))
}

/**
 * Resets all tooltip states.
 */
export const resetTooltips = () => dispatch => {
    dispatch(setShowTooltip(false))
    dispatch(resetWhichTooltip())
}
