import { createReducer } from 'redux-act'
import * as actions from './actions'
import setUnreadCount from '../../util/setUnreadCount'

const defaultState = {
    unreadMessagesCount: 0,
}

const setUnreadMessages = state => {
    const unreadMessages = setUnreadCount(0)
    return { ...state, unreadMessagesCount: unreadMessages }
}

export default createReducer(
    {
        [actions.unreadMessagesCount]: setUnreadMessages,
    },
    defaultState,
)
