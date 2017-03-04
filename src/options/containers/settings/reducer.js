import { persistentReducer } from 'redux-pouchdb'
import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    blacklist: []
}

function addNewBlacklistedSite(state, payload) {
    const blacklist = [
        payload,
        ...state.blacklist
    ]

    return {
        ...state,
        blacklist
    }
}

function deleteBlacklistedSite(state, payload) {
    const blacklist = [
        ...state.blacklist.slice(0, payload.index),
        ...state.blacklist.slice(payload.index + 1, state.blacklist.length)
    ]

    return {
        ...state,
        blacklist
    }
}

export default persistentReducer(createReducer({
    [actions.addNewBlacklistedSite]: addNewBlacklistedSite,
    [actions.deleteBlacklistedSite]: deleteBlacklistedSite
}, defaultState))
