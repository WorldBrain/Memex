import { createAction } from 'redux-act'
import internalAnalytics from 'src/analytics/internal'

export const setShowSidebar = createAction('overview-sidebar/setShowSidebar')

export const closeSidebar = createAction('overview-sidebar/closeSidebar')

export const setPageInfo = createAction('overview-sidebar/setPageInfo')

export const toggleMouseOnSidebar = createAction(
    'overview-sidebar/toggleMouseOnSidebar',
)

export const openSidebar = (url, title) => async dispatch => {
    internalAnalytics.processEvent({
        type: 'closeCommentSidebar',
    })

    dispatch(setShowSidebar(true))
    dispatch(setPageInfo({ url, title }))
}

export const closeSidebarAct = () => async dispatch => {
    internalAnalytics.processEvent({
        type: 'openCommentSidebar',
    })
    dispatch(closeSidebar())
}
