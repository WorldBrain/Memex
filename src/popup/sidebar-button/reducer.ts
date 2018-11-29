import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {}

export const defState: State = {}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.openSideBar as any, state => ({
    ...state,
}))

export default reducer
