import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    notificationList: [],
}

export default createReducer(
    {
        [actions.setNotificationList]: (state, notifications) => ({
            ...state,
            notificationList: notifications,
        }),
    },
    defaultState,
)
