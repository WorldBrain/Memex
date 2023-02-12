import { createSelector } from 'reselect'

import { RootState } from '../types'

const sidebarOpenBtn = (state: RootState) => state.sidebarOpenBtn

export const isSidebarEnabled = createSelector(
    sidebarOpenBtn,
    (state) => state.isEnabled,
)
