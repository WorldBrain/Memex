import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    readNotificationList: [],
    unreadNotificationList: [],
    showMoreIndex: undefined,
    unreadNotifications: 0,
}

export default createReducer(
    {
        [actions.setReadNotificationList]: (state, notifications) => ({
            ...state,
            readNotificationList: notifications,
        }),
        [actions.setUnreadNotificationList]: (state, notifications) => ({
            ...state,
            unreadNotificationList: notifications,
        }),
        [actions.setUnreadNotis]: (state, notifs) => ({
            ...state,
            unreadNotifications: notifs,
        }),
        [actions.setShowMoreIndex]: (state, index) => ({
            ...state,
            showMoreIndex: index,
        }),
    },
    defaultState,
)
