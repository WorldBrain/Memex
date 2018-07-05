import { createReducer } from 'redux-act'

import * as actions from './actions'

export interface State {
    readNotificationList: any[]
    unreadNotificationList: any[]
    showMoreIndex?: any
    unreadNotifications: number
}

const defaultState: State = {
    readNotificationList: [],
    unreadNotificationList: [],
    showMoreIndex: undefined,
    unreadNotifications: 0,
}

const initState = <T>(key) => (state: State, payload: T) => ({
    ...state,
    [key]: payload,
})

const reducer = createReducer<State>({}, defaultState)

reducer.on(actions.setReadNotificationList, initState<boolean>('readNotificationList'))
reducer.on(actions.setUnreadNotificationList, initState<boolean>('unreadNotificationList'))
reducer.on(actions.setShowMoreIndex, initState<boolean>('showMoreIndex'))

export default reducer
