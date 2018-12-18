import { createAction } from 'redux-act'
import { getLocalStorage } from 'src/util/storage'

export const setWhichTooltip = createAction<boolean>('tooltips/setTooltip')
export const toggleShowTooltip = createAction('tooltips/toggleShowTooltip')
export const setShowTooltip = createAction<boolean>('tooltips/setShowTooltip')

export const fetchWhichTooltip = async dispatch => {
    const whichTooltip = await getLocalStorage('onboarding-overview-tooltip')
    dispatch(setWhichTooltip(whichTooltip))
}
