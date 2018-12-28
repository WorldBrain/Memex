import { createReducer } from 'redux-act'
import { combineReducers } from 'redux'

import * as actions from './actions'
import State from './types'
import {
    reducer as commentBoxReducer,
    defaultState as defCommentBoxState,
} from '../comment-box'

export const defaultState: State = {
    isOpen: false,
    commentBox: defCommentBoxState,
}

const setSidebarOpen = (state: boolean, isOpen: boolean) => isOpen

const isOpenReducer = createReducer<boolean>(on => {
    on(actions.setSidebarOpen, setSidebarOpen)
}, defaultState.isOpen)

const reducer = combineReducers<State>({
    isOpen: isOpenReducer,
    commentBox: commentBoxReducer,
})

export default reducer
