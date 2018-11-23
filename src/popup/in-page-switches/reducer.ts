import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Denotes whether or not the tooltip toggle is enabled in the popup. */
    isTooltipEnabled: boolean
    isSidebarEnabled: boolean
}

export const defState: State = {
    isTooltipEnabled: true,
    isSidebarEnabled: true,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setSidebarFlag, (state, payload) => ({
    ...state,
    isSidebarEnabled: payload,
}))

reducer.on(acts.setTooltipFlag, (state, payload) => ({
    ...state,
    isTooltipEnabled: payload,
}))

export default reducer
