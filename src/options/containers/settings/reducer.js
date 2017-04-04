import { createReducer } from 'redux-act'
import { addBlacklistedSiteToPouch } from './actions'

import * as actions from './actions'

const defaultState = {
    blacklist: []
}

function setBlacklist(state, blacklist) {
    return {
        ...state,
        blacklist
    }
}

function addSiteToBlacklist(state, payload) {
    const blacklist = [
        payload,
        ...state.blacklist
    ]

    return {
        ...state,
        blacklist
    }
}

function removeSiteFromBlacklist(state, payload) {
    const blacklist = [
        ...state.blacklist.slice(0, payload.index),
        ...state.blacklist.slice(payload.index + 1, state.blacklist.length)
    ]

    return {
        ...state,
        blacklist
    }
}

export default createReducer({
    [actions.setBlacklist]: setBlacklist,
    [actions.addSiteToBlacklist]: addSiteToBlacklist,
    [actions.removeSiteFromBlacklist]: removeSiteFromBlacklist
}, defaultState)
