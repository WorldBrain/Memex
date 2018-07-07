import { createReducer } from 'redux-act'

// import * as actions from './actions'

const defaultState = {
    tagFilter: true,
}

export default createReducer({}, defaultState)
