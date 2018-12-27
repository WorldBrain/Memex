import { createReducer } from 'redux-act'

import * as actions from './actions'
import State from './types'

export const defaultState: State = {
    isOpen: false,
    isUserCommenting: true,
}

const setSidebarOpen = (state: State, isOpen: boolean) => ({
    ...state,
    isOpen,
})

const setUserCommenting = (state: State, isUserCommenting: boolean) => ({
    ...state,
    isUserCommenting,
})

const reducer = createReducer<State>(on => {
    on(actions.setSidebarOpen, setSidebarOpen)
    on(actions.setUserCommenting, setUserCommenting)
}, defaultState)

export default reducer
