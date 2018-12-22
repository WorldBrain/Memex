import { createReducer } from 'redux-act'

export interface State {}

export const defaultState: State = {}

const reducer = createReducer<State>({}, defaultState)

export default reducer
