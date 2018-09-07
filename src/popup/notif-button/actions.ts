import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'

const fetchUnreadCountRPC = remoteFunction('fetchUnreadCount')

export const setNotifCount = createAction<number>('notifs/setNotifCount')

export const initState: () => Thunk = () => async dispatch => {
    const count = await fetchUnreadCountRPC()
    dispatch(setNotifCount(count))
}
