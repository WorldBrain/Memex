import { createAction } from 'redux-act'
import setUnreadCount from '../../util/setUnreadCount'

export const unreadMessagesCount = createAction(
    'notifications/unreadMessagesCount',
)

export const unreadMessagesUpdate = () => async dispatch => {
    const unreadMessages = await setUnreadCount(0)
    dispatch(unreadMessagesCount(unreadMessages))
}
