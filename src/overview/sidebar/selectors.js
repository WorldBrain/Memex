import { createSelector } from 'reselect'

export const overview = state => state.sidebar

export const showSidebar = createSelector(overview, state => state.showSidebar)

export const annotations = createSelector(overview, state => state.annotations)

export const mouseOnSidebar = createSelector(
    overview,
    state => state.mouseOnSidebar,
)
