import { createSelector } from 'reselect'

import * as RootSelectors from '../selectors'

export const ribbon = RootSelectors.ribbon

export const isPageFullScreen = createSelector(
    ribbon,
    state => state.isPageFullScreen,
)

export const isExpanded = createSelector(ribbon, state => state.isExpanded)

export const isRibbonEnabled = createSelector(
    ribbon,
    state => state.isRibbonEnabled,
)

export const isTooltipEnabled = createSelector(
    ribbon,
    state => state.isTooltipEnabled,
)
