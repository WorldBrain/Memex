import { createAction } from 'redux-act'

import { remoteFunction } from 'src/util/webextensionRPC'

import { EVENT_NAMES } from '../../analytics/internal/constants'

export const setShowSidebar = createAction('overview-sidebar/setShowSidebar')

export const closeSidebar = createAction('overview-sidebar/closeSidebar')

export const setPageInfo = createAction('overview-sidebar/setPageInfo')

const processEvent = remoteFunction('processEvent')

export const toggleMouseOnSidebar = createAction(
    'overview-sidebar/toggleMouseOnSidebar',
)

export const setShowSideBarMid = val => async dispatch => {
    processEvent({
        type: val
            ? EVENT_NAMES.OPEN_COMMENT_SIDEBAR
            : EVENT_NAMES.CLOSE_COMMENT_SIDEBAR,
    })

    dispatch(setShowSidebar(val))
}

export const openSidebar = (url, title) => async dispatch => {
    processEvent({
        type: EVENT_NAMES.OPEN_COMMENT_SIDEBAR,
    })

    dispatch(setShowSidebar(true))
    dispatch(
        setPageInfo({
            url,
            title,
        }),
    )
}
