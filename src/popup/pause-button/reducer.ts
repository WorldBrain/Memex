import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Denotes whether or not the ext is paused. */
    isPaused: boolean
    /** Represents the # of mins the user has selected to pause for. */
    time: number
}

export const defState: State = {
    isPaused: false,
    time: 20,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setPaused, (state, payload) => ({
    ...state,
    isPaused: payload,
}))

reducer.on(acts.setTimeout, (state, payload) => ({
    ...state,
    time: payload,
}))

export default reducer
