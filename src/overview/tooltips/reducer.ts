import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    showTooltip: boolean
    whichTooltip: string
}

const defState: State = {
    showTooltip: false,
    whichTooltip: '',
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setWhichTooltip, (state, payload) => ({
    ...state,
    whichTooltip: payload,
}))

reducer.on(acts.setShowTooltip, (state, payload) => ({
    ...state,
    showTooltip: payload,
}))

export default reducer
