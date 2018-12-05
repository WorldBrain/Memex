import { createSelector } from 'reselect'

import { RootState } from '../types'

const sidebarBtn = (state: RootState) => state.sidebarBtn

export const isSidebarEnabled = createSelector(
    sidebarBtn,
    state => state.isEnabled,
)
