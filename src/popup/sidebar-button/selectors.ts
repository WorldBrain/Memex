import { createSelector } from 'reselect'

import { RootState } from '../types'

const tooltipBtn = (state: RootState) => state.inPageSwitches

export const isTooltipEnabled = createSelector(tooltipBtn, state => false)
