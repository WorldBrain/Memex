/* tslint:disable:no-shadowed-variable */
import { createSelector } from 'reselect'

import { RootState } from '../../options/types'

export const tooltips = (state: RootState) => state.tooltips

export const tooltip = createSelector(tooltips, state => state.tooltip)
export const showTooltip = createSelector(tooltips, state => state.showTooltip)

export const isFirstTooltip = createSelector(
    tooltip,
    showTooltip,
    (tooltip, showTooltip) => tooltip === null && showTooltip,
)

export const isTooltipRenderable = createSelector(
    tooltip,
    showTooltip,
    (tooltip, showTooltip) => tooltip !== null && showTooltip,
)
