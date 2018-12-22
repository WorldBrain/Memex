import { createSelector } from 'reselect'

import RootState from '../types'

const ribbon = (state: RootState) => state.ribbon

export const isMouseHoveringOver = createSelector(
    ribbon,
    state => state.isMouseHoveringOver,
)

export const isRibbonEnabled = createSelector(
    ribbon,
    state => state.isRibbonEnabled,
)

export const isTooltipEnabled = createSelector(
    ribbon,
    state => state.isTooltipEnabled,
)
