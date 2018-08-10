import { createSelector } from 'reselect'

import { RootState } from '../types'

const tooltipBtn = (state: RootState) => state.tooltipBtn

export const isTooltipEnabled = createSelector(
    tooltipBtn,
    state => state.isEnabled,
)
