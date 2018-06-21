import { createAction } from 'redux-act'

export const setShowSidebar = createAction('overview-sidebar/setShowSidebar')

export const closeSidebar = createAction('overview-sidebar/closeSidebar')

export const setPageUrl = createAction('overview-sidebar/setPageUrl')

export const toggleMouseOnSidebar = createAction(
    'overview-sidebar/toggleMouseOnSidebar',
)

export const openSidebar = url => async (dispatch, getState) => {
    dispatch(setShowSidebar(true))
    dispatch(setPageUrl(url))
}
