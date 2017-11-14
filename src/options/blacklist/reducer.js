import { createReducer } from 'redux-act'
import * as actions from './actions'

const defaultState = {
    blacklist: [],
    siteInputValue: '',
    showRemoveModal: false,
    lastValue: undefined,
}

export default createReducer(
    {
        [actions.toggleModal]: state => ({
            ...state,
            showRemoveModal: !state.showRemoveModal,
        }),
        [actions.setBlacklist]: (state, blacklist) => ({ ...state, blacklist }),
        [actions.setSiteInputValue]: (state, { siteInputValue }) => ({
            ...state,
            siteInputValue,
        }),
        [actions.resetSiteInputValue]: state => ({
            ...state,
            siteInputValue: '',
            lastValue: state.siteInputValue,
        }),
        [actions.addSiteToBlacklist]: (state, site) => ({
            ...state,
            blacklist: [site, ...state.blacklist],
        }),
        [actions.removeSiteFromBlacklist]: (state, { index }) => ({
            ...state,
            blacklist: [
                ...state.blacklist.slice(0, index),
                ...state.blacklist.slice(index + 1),
            ],
        }),
    },
    defaultState,
)
