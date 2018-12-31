import { createSelector } from 'reselect'

import * as RootSelectors from '../ribbon-sidebar-controller/selectors'

export const ribbon = RootSelectors.ribbon

export const isExpanded = createSelector(ribbon, state => state.isExpanded)

export const isRibbonEnabled = createSelector(
    ribbon,
    state => state.isRibbonEnabled,
)

export const isTooltipEnabled = createSelector(
    ribbon,
    state => state.isTooltipEnabled,
)
