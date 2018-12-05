import { createSelector } from 'reselect'

import { RootState } from '../types'

const tooltipButton = (state: RootState) => state.tooltipBtn

export const isTooltipEnabled = createSelector(
    tooltipButton,
    state => state.isEnabled,
)
