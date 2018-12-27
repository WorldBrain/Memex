import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    showTooltip: boolean
    whichTooltip: string
    prevTooltips: string[]
}

const defState: State = {
    showTooltip: false,
    whichTooltip: '',
    prevTooltips: [],
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

reducer.on(acts.setPrevTooltips, (state, payload) => ({
    ...state,
    prevTooltips: payload,
}))

export default reducer
