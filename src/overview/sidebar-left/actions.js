import { createAction } from 'redux-act'

export const closeSidebar = createAction('sidebar/closeSidebar')
export const openSidebar = createAction('sidebar/openSidebar')
export const setSidebarState = createAction('sidebar/setSidebarState')
export const setSidebarLocked = createAction('sidebar/setSidebarLocked')
export const setMouseOver = createAction('custom-lists/setMouseOver')
export const resetMouseOver = createAction('custom-lists/resetMouseOver')
