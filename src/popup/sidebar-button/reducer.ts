import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Denotes whether or not the tooltip toggle is enabled in the popup. */
    isEnabled: boolean
}

export const defState: State = {
    isEnabled: true,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setSidebarFlag, (state, payload) => ({
    ...state,
    isEnabled: payload,
}))

reducer.on(acts.openSideBar as any, state => ({
    ...state,
}))

export default reducer
