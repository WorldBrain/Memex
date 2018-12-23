import { getSidebarState } from '../utils'
import { getTooltipState } from '../../content-tooltip/utils'
import { Thunk } from '../types'
import { actions as ribbonActions } from '../ribbon'

/**
 * Hydrates the Redux store on initial startup.
 */
export const initState: () => Thunk = () => async dispatch => {
    const isRibbonEnabled = await getSidebarState()
    const isTooltipEnabled = await getTooltipState()

    dispatch(ribbonActions.setRibbonEnabled(isRibbonEnabled))
    dispatch(ribbonActions.setTooltipEnabled(isTooltipEnabled))
}
