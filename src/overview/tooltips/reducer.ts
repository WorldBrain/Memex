import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    showTooltip: boolean
    whichTooltip: number
}

const defState: State = {
    showTooltip: false,
    whichTooltip: -1,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setWhichTooltip, (state, payload) => ({
    ...state,
    whichTooltip: payload,
}))

reducer.on(acts.resetWhichTooltip, state => ({
    ...state,
    whichTooltip: -1,
}))

reducer.on(acts.setShowTooltip, (state, payload) => ({
    ...state,
    showTooltip: payload,
}))

export default reducer
