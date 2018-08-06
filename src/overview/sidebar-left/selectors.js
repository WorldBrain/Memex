import { createSelector } from 'reselect'

export const sidebar = state => state.sidebarLeft
export const showFilters = createSelector(sidebar, state => state.showFilters)
export const isSidebarOpen = createSelector(sidebar, state => state.openSidebar)
export const mouseOverSidebar = createSelector(
    sidebar,
    state => state.mouseOverSidebar,
)
