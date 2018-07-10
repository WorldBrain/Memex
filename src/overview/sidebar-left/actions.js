import { createAction } from 'redux-act'

export const closeSidebar = createAction('sidebar/closeSidebar')
export const openSidebar = createAction('sidebar/openSidebar')
export const showFilters = createAction('sidebar/showFilters')
export const hideFilters = createAction('sidebar/hideFilters')

export const openSidebarFilterMode = () => dispatch => {
    dispatch(openSidebar())
    dispatch(showFilters())
}

export const openSidebarListMode = () => dispatch => {
    dispatch(openSidebar())
    dispatch(hideFilters())
}
