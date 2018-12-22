import { createReducer } from 'redux-act'

import * as actions from './actions'
import State from './types'

export const defaultState: State = {
    isOpen: false,
}

const setSidebarOpen = (state: State, isOpen: boolean) => ({
    ...state,
    isOpen,
})

const reducer = createReducer<State>(on => {
    on(actions.setSidebarOpen, setSidebarOpen)
}, defaultState)

export default reducer
