import { createAction } from 'redux-act'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

import * as selectors from './selectors'
import { STORAGE_KEY as tooltipKey } from './constants'
import { STORAGE_KEYS as onboardingKeys } from '../onboarding/constants'

export const setWhichTooltip = createAction<string>('tooltips/setTooltip')
export const setShowTooltip = createAction<boolean>('tooltips/setShowTooltip')
export const setPrevTooltips = createAction<string[]>(
    'tooltips/setPrevTooltips',
)

export const fetchOnboardingState = () => async dispatch => {
    const onboardingState = await getLocalStorage(
        onboardingKeys.onboardingDemo.step2,
    )
    if (onboardingState === 'overview-tooltips') {
        dispatch(setShowTooltip(true))
    }
}

export const fetchWhichTooltip = () => async (dispatch, getState) => {
    const whichTooltip = await getLocalStorage(tooltipKey, 'none')
    const prevTooltips = selectors.prevTooltips(getState())
    if (!prevTooltips.length && whichTooltip !== 'none') {
        prevTooltips.push(whichTooltip)
    }
    dispatch(setWhichTooltip(whichTooltip))
    dispatch(setPrevTooltips(prevTooltips))
}

/**
 * Temporarily removes tooltip by setting whichTooltip to 'none'
 */
export const closeTooltip = () => dispatch => {
    dispatch(setWhichTooltip('none'))
}

/**
 * Sets whichTooltip to nextTooltip if next tooltip isn't already shown.
 * Also pushes nextTooltip to prevTooltips array.
 * @param nextTooltip The next tooltip to be shown
 */
export const setNextTooltip = nextTooltip => (dispatch, getState) => {
    const prevTooltips = selectors.prevTooltips(getState())

    // If the next tooltip is already present, do nothing and return
    if (prevTooltips.indexOf(nextTooltip) !== -1) {
        return
    }

    prevTooltips.push(nextTooltip)
    dispatch(setWhichTooltip(nextTooltip))
    dispatch(setPrevTooltips(prevTooltips))
}

/**
 * Sets tooltip to the previous tooltip shown.
 * Does nothing, if there was no previous tooltip shown
 */
export const previousTooltip = () => (dispatch, getState) => {
    const prevTooltips = selectors.prevTooltips(getState())
    prevTooltips.pop()
    // Return if prevTooltips is empty
    if (!prevTooltips.length) {
        return
    }

    const whichTooltip = prevTooltips[prevTooltips.length - 1]
    dispatch(setWhichTooltip(whichTooltip))
    dispatch(setPrevTooltips(prevTooltips))
}

/**
 * Resets all tooltip states.
 */
export const resetTooltips = () => dispatch => {
    dispatch(setShowTooltip(false))
    dispatch(setWhichTooltip('none'))
    dispatch(setPrevTooltips([]))
}
