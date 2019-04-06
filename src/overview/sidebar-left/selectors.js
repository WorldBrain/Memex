import { createSelector } from 'reselect'

export const sidebar = state => state.sidebarLeft
export const isSidebarOpen = createSelector(sidebar, state => state.openSidebar)
export const sidebarLocked = createSelector(
    sidebar,
    state => state.sidebarLocked,
)
export const mouseOverSidebar = createSelector(
    sidebar,
    state => state.mouseOverSidebar,
)
