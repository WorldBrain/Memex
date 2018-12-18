import { createAction } from 'redux-act'

import { Tooltip } from '../types'
import { fetchNextTooltip } from './tooltips'

export const setTooltip = createAction<Tooltip>('tooltips/setTooltip')
export const toggleShowTooltip = createAction('tooltips/toggleShowTooltip')
export const setShowTooltip = createAction<boolean>('tooltips/setShowTooltip')

export const nextTooltip = () => async dispatch => {
    const tooltip = await fetchNextTooltip()
    dispatch(setTooltip(tooltip))
}
