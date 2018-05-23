import { createSelector } from 'reselect'

export const overview = state => state.sidebar

export const showSidebar = createSelector(overview, state => state.showSidebar)

export const annotation = createSelector(overview, state => state.annotation)
