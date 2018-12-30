/* tslint:disable:no-shadowed-variable */
import { createSelector } from 'reselect'

import { TOOLTIPS } from './constants'
import { RootState } from '../../options/types'

export const tooltips = (state: RootState) => state.tooltips

export const whichTooltip = createSelector(
    tooltips,
    state => state.whichTooltip,
)
export const showTooltip = createSelector(tooltips, state => state.showTooltip)

/**
 * Returns the tooltip name based on whichTooltip.
 * If whichTooltip is -1, returns 'none'
 */
export const tooltip = createSelector(whichTooltip, whichTooltip => {
    if (whichTooltip === -1) {
        return 'none'
    }
    console.log(whichTooltip)
    return TOOLTIPS[whichTooltip]
})
