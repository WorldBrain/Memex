import { createReducer } from 'redux-act'
import * as actions from './actions'

const defaultState = {
    freezeDryBookmarks: false,
    freezeDryArchive: false,
}

export default createReducer({
    [actions.toggleFreezeDryBookmarks]: state => ({ ...state, freezeDryBookmarks: !state.freezeDryBookmarks }),
    [actions.setFreezeDryBookmarks]: (state, freezeDryBookmarks) => ({ ...state, freezeDryBookmarks }),
    [actions.toggleFreezeDryArchive]: state => ({ ...state, freezeDryArchive: !state.freezeDryArchive }),
    [actions.setFreezeDryArchive]: (state, freezeDryArchive) => ({ ...state, freezeDryArchive }),
}, defaultState)
