import { createReducer } from 'redux-act'

import { Tooltip } from '../types'
import * as acts from './actions'

export interface State {
    tooltip: Tooltip
    showTooltip: boolean
}

const defState: State = {
    tooltip: null,
    showTooltip: true,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setTooltip, (state, payload) => ({
    ...state,
    tooltip: payload,
}))

reducer.on(acts.toggleShowTooltip, state => ({
    ...state,
    showTooltip: !state.showTooltip,
}))

reducer.on(acts.setShowTooltip, (state, payload) => ({
    ...state,
    showTooltip: payload,
}))

export default reducer
