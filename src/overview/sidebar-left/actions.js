import { createAction } from 'redux-act'

export const closeSidebar = createAction('sidebar/closeSidebar')
export const openSidebar = createAction('sidebar/openSidebar')
export const showFilters = createAction('sidebar/showFilters')
export const hideFilters = createAction('sidebar/hideFilters')
export const setSidebarState = createAction('sidebar/setSidebarState')

export const openSidebarFilterMode = () => dispatch => {
    dispatch(showFilters())
    dispatch(openSidebar())
}

export const openSidebarListMode = () => dispatch => {
    dispatch(openSidebar())
    dispatch(hideFilters())
}
