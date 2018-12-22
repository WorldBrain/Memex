import { createSelector } from 'reselect'

import RootState from '../ribbon-sidebar-controller/types'

export const ribbon = (state: RootState) => state.ribbon

export const isExpanded = createSelector(ribbon, state => state.isExpanded)

export const isRibbonEnabled = createSelector(
    ribbon,
    state => state.isRibbonEnabled,
)

export const isTooltipEnabled = createSelector(
    ribbon,
    state => state.isTooltipEnabled,
)
