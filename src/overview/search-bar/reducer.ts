import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Holds the current query input state. */
    query: string
    /** Holds the current lower-bound time query. */
    startDate: number
    /** Holds the current upper-bound time query. */
    endDate: number
    startDateText: string
    endDateText: string
}

const defState: State = {
    query: '',
    startDate: undefined,
    endDate: undefined,
    startDateText: '',
    endDateText: '',
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

reducer.on(acts.setStartDateText, (state, payload) => ({
    ...state,
    startDateText: payload,
}))

reducer.on(acts.setEndDateText, (state, payload) => ({
    ...state,
    endDateText: payload,
}))

reducer.on(acts.clearFilters, state => ({
    ...defState,
    query: '',
}))

export default reducer
