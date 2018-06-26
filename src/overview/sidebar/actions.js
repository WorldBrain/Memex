import { createAction } from 'redux-act'

export const setShowSidebar = createAction('overview-sidebar/setShowSidebar')

export const closeSidebar = createAction('overview-sidebar/closeSidebar')

export const setPageInfo = createAction('overview-sidebar/setPageInfo')

export const toggleMouseOnSidebar = createAction(
    'overview-sidebar/toggleMouseOnSidebar',
)

export const openSidebar = (url, title) => async dispatch => {
    dispatch(setShowSidebar(true))
    dispatch(setPageInfo({ url, title }))
}
