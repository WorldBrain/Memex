import { createAction } from 'redux-act'

import { remoteFunction } from 'src/util/webextensionRPC'

export const setShowSidebar = createAction('overview-sidebar/setShowSidebar')

export const closeSidebar = createAction('overview-sidebar/closeSidebar')

export const setPageInfo = createAction('overview-sidebar/setPageInfo')

const processEvent = remoteFunction('processEvent')

export const toggleMouseOnSidebar = createAction(
    'overview-sidebar/toggleMouseOnSidebar',
)

export const setShowSideBarMid = val => async dispatch => {
    processEvent({
        type: val ? 'openCommentSidebar' : 'closeCommentSidebar',
    })

    dispatch(setShowSidebar(val))
}

export const openSidebar = (url, title) => async dispatch => {
    processEvent({
        type: 'openCommentSidebar',
    })

    dispatch(setShowSidebar(true))
    dispatch(setPageInfo({ url, title }))
}
