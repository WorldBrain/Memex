import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Holds the current query input state. */
    query: string
    /** Holds the current lower-bound time query. */
    startDate: number
    /** Holds the current upper-bound time query. */
    endDate: number
}

const defState: State = {
    query: '',
    startDate: undefined,
    endDate: undefined,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setQuery, (state, payload) => ({
    ...state,
    query: payload,
}))

reducer.on(acts.setStartDate, (state, payload) => ({
    ...state,
    startDate: payload,
}))

reducer.on(acts.setEndDate, (state, payload) => ({
    ...state,
    endDate: payload,
}))

export default reducer
