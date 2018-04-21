import { createReducer } from 'redux-act'
import * as actions from './actions'

const defaultState = {
    unreadMessagesCount: 0,
}

const updateMessageCount = (state, unreadMessagesCount) => {
    return {
        ...state,
        unreadMessagesCount:
            unreadMessagesCount === undefined ? 0 : unreadMessagesCount,
    }
}

export default createReducer(
    {
        [actions.unreadMessagesCount]: updateMessageCount,
    },
    defaultState,
)
