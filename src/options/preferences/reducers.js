import { createReducer } from 'redux-act'
import * as actions from './actions'

const defaultState = {
    freezeDryBookmarks: false,
}

export default createReducer({
    [actions.toggleFreezeDryBookmarks]: state => ({ ...state, freezeDryBookmarks: !state.freezeDryBookmarks }),
    [actions.setFreezeDryBookmarks]: (state, freezeDryBookmarks) => ({ ...state, freezeDryBookmarks }),
}, defaultState)
