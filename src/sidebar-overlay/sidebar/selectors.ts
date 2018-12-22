import { createSelector } from 'reselect'

import RootState from '../ribbon-sidebar-controller/types'

export const sidebar = (state: RootState) => state.sidebar

export const isOpen = createSelector(sidebar, state => state.isOpen)
