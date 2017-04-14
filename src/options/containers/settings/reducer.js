import { createReducer } from 'redux-act'
import * as actions from './actions'

const defaultState = {
    blacklist: [],
    siteInputValue: '',
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
    [actions.setSiteInputValue]: (state, { siteInputValue }) => ({ ...state, siteInputValue }),
    [actions.resetSiteInputValue]: (state) => ({ ...state, siteInputValue: '' }),
    [actions.setBlacklist]: setBlacklist,
    [actions.addSiteToBlacklist]: addSiteToBlacklist,
    [actions.removeSiteFromBlacklist]: removeSiteFromBlacklist
}, defaultState)
