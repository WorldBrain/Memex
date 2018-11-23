import { createSelector } from 'reselect'

import { RootState } from '../types'

const inPageSwitches = (state: RootState) => state.inPageSwitches

export const isSidebarEnabled = createSelector(
    inPageSwitches,
    state => state.isSidebarEnabled,
)

export const isTooltipEnabled = createSelector(
    inPageSwitches,
    state => state.isTooltipEnabled,
)
